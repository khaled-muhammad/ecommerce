import { Router } from "express";
import { z } from "zod";
import { eq, and, or, sql, desc, asc, inArray, gte, lte, ilike, getTableColumns } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, brands, products } from "../../db/schema/catalog.js";
import { optionalAuth } from "../../middleware/auth.js";

const router = Router();

function param(req: { params: Record<string, string | string[]> }, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v ?? "";
}

function parseBrandSlugs(q: Record<string, unknown>): string[] {
  const raw = q.brand;
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
  if (typeof raw === "string" && raw.length > 0) return [raw];
  return [];
}

function parseDollarCents(raw: string | undefined): number | undefined {
  if (raw == null || String(raw).trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

type StockFilter = "in" | "out" | undefined;

async function buildProductConditions(input: {
  categorySlug?: string;
  search?: string;
  minCents?: number;
  maxCents?: number;
  brandSlugs?: string[];
  stock?: StockFilter;
}): Promise<SQL[]> {
  const conditions: SQL[] = [eq(products.isActive, true)];

  if (input.categorySlug) {
    const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, input.categorySlug)).limit(1);
    if (cat.length) conditions.push(eq(products.categoryId, cat[0].id));
    else conditions.push(sql`false`);
  }

  const search = input.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(ilike(products.name, pattern), ilike(products.shortDescription, pattern), ilike(brands.name, pattern))!,
    );
  }

  if (input.minCents != null) conditions.push(gte(products.priceCents, input.minCents));
  if (input.maxCents != null) conditions.push(lte(products.priceCents, input.maxCents));

  const slugs = input.brandSlugs ?? [];
  if (slugs.length > 0) {
    const rows = await db.select({ id: brands.id }).from(brands).where(inArray(brands.slug, slugs));
    const ids = rows.map((r) => r.id);
    if (ids.length > 0) conditions.push(inArray(products.brandId, ids));
    else conditions.push(sql`false`);
  }

  if (input.stock === "in") conditions.push(sql`${products.stock} > 0`);
  if (input.stock === "out") conditions.push(sql`${products.stock} <= 0`);

  return conditions;
}

function stockFromQuery(stock: string | undefined): StockFilter {
  if (stock === "in" || stock === "out") return stock;
  return undefined;
}

// ── Categories ──

router.get("/categories", optionalAuth, async (_req, res, next) => {
  try {
    const rows = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/categories/:slug", optionalAuth, async (req, res, next) => {
  try {
    const slug = param(req, "slug");
    const [row] = await db.select().from(categories).where(and(eq(categories.slug, slug), eq(categories.isActive, true))).limit(1);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND", message: "Category not found" });
      return;
    }
    res.json({ category: row });
  } catch (err) {
    next(err);
  }
});

// ── Brands ──

router.get("/brands", optionalAuth, async (_req, res, next) => {
  try {
    const rows = await db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name));
    res.json({ brands: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/brands/:slug", optionalAuth, async (req, res, next) => {
  try {
    const slug = param(req, "slug");
    const [row] = await db.select().from(brands).where(and(eq(brands.slug, slug), eq(brands.isActive, true))).limit(1);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND", message: "Brand not found" });
      return;
    }
    res.json({ brand: row });
  } catch (err) {
    next(err);
  }
});

// ── Products: search suggestions (must be before /products/:slug) ──

const suggestionsQuerySchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(15).optional().default(10),
});

router.get("/products/search-suggestions", optionalAuth, async (req, res, next) => {
  try {
    const query = suggestionsQuerySchema.parse(req.query);
    const term = query.q.trim();
    if (term.length < 2) {
      res.json({ suggestions: [] });
      return;
    }

    const pattern = `%${term}%`;
    const prefixPattern = `${term}%`;

    const brandHits = await db
      .select({ slug: brands.slug, name: brands.name })
      .from(brands)
      .where(and(eq(brands.isActive, true), ilike(brands.name, pattern)))
      .orderBy(
        sql`case when ${brands.name} ilike ${prefixPattern} then 0 else 1 end`,
        asc(brands.name),
      )
      .limit(5);

    const productHits = await db
      .select({
        slug: products.slug,
        name: products.name,
        brandName: brands.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(
        and(
          eq(products.isActive, true),
          or(ilike(products.name, pattern), ilike(products.shortDescription, pattern), ilike(brands.name, pattern))!,
        ),
      )
      .orderBy(
        sql`case when ${products.name} ilike ${prefixPattern} then 0 else 1 end`,
        desc(sql`coalesce(${products.featuredRank}, 0)`),
        asc(products.name),
      )
      .limit(query.limit);

    type Sug = { type: "brand" | "product"; slug: string; label: string; hint?: string };
    const out: Sug[] = [];
    const seen = new Set<string>();

    for (const b of brandHits) {
      const key = `b:${b.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ type: "brand", slug: b.slug, label: b.name });
      if (out.length >= query.limit) break;
    }

    for (const p of productHits) {
      if (out.length >= query.limit) break;
      const key = `p:${p.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        type: "product",
        slug: p.slug,
        label: p.name,
        hint: p.brandName ?? undefined,
      });
    }

    res.json({ suggestions: out });
  } catch (err) {
    next(err);
  }
});

// ── Batch resolve by UUID (cart, etc.) ──

router.get("/products/resolve", optionalAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ ids: z.string().min(1).max(4000) }).parse(req.query);
    const raw = [...new Set(parsed.ids.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 40);
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const valid = raw.filter((id) => uuidRe.test(id));
    if (valid.length === 0) {
      res.json({ products: [] });
      return;
    }

    const cols = getTableColumns(products);
    const rows = await db
      .select({
        ...cols,
        brand: sql<string>`coalesce(${brands.name}, 'Other')`,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), inArray(products.id, valid)));

    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
});

// ── Facet counts ──

const facetQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  stock: z.enum(["in", "out", "all"]).optional(),
});

router.get("/products/facets", optionalAuth, async (req, res, next) => {
  try {
    const query = facetQuerySchema.parse(req.query);
    const minCents = parseDollarCents(query.min);
    const maxCents = parseDollarCents(query.max);
    const stockForBrands = stockFromQuery(query.stock === "all" ? undefined : query.stock);

    const baseConditions = await buildProductConditions({
      categorySlug: query.category,
      search: query.search,
      minCents,
      maxCents,
    });

    const baseWhere = and(...baseConditions);
    const joinStock = (s: StockFilter): SQL | undefined => {
      if (s === "in") return sql`${products.stock} > 0`;
      if (s === "out") return sql`${products.stock} <= 0`;
      return undefined;
    };

    const brandSliceWhere = and(baseWhere, joinStock(stockForBrands) ?? sql`true`);

    const [baseTotalRow, inStockRow, outStockRow, brandCounts, priceRange] = await Promise.all([
      db
        .select({ count: sql<number>`count(distinct ${products.id})::int` })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(baseWhere),
      db
        .select({ count: sql<number>`count(distinct ${products.id})::int` })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(and(baseWhere, sql`${products.stock} > 0`)),
      db
        .select({ count: sql<number>`count(distinct ${products.id})::int` })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(and(baseWhere, sql`${products.stock} <= 0`)),
      db
        .select({
          brandId: products.brandId,
          brandName: brands.name,
          brandSlug: brands.slug,
          count: sql<number>`count(distinct ${products.id})::int`,
        })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(brandSliceWhere)
        .groupBy(products.brandId, brands.name, brands.slug)
        .having(sql`count(distinct ${products.id}) > 0`),
      db
        .select({
          min: sql<number>`min(${products.priceCents})`,
          max: sql<number>`max(${products.priceCents})`,
        })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(baseWhere),
    ]);

    res.json({
      baseTotal: Number(baseTotalRow[0]?.count ?? 0),
      inStock: Number(inStockRow[0]?.count ?? 0),
      outOfStock: Number(outStockRow[0]?.count ?? 0),
      brands: brandCounts
        .filter((b) => b.brandSlug && b.brandName)
        .map((b) => ({ name: b.brandName!, slug: b.brandSlug!, count: Number(b.count) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      priceRange: priceRange[0]
        ? { minCents: Number(priceRange[0].min) || 0, maxCents: Number(priceRange[0].max) || 0 }
        : { minCents: 0, maxCents: 0 },
    });
  } catch (err) {
    next(err);
  }
});

// ── Product list ──

const listProductsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest", "name"]).optional().default("featured"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(24),
  min: z.string().optional(),
  max: z.string().optional(),
  stock: z.enum(["in", "out", "all"]).optional(),
});

router.get("/products", optionalAuth, async (req, res, next) => {
  try {
    const query = listProductsSchema.parse(req.query);
    const brandSlugs = parseBrandSlugs(req.query as Record<string, unknown>);
    const offset = (query.page - 1) * query.limit;
    const minCents = parseDollarCents(query.min);
    const maxCents = parseDollarCents(query.max);
    const stock = stockFromQuery(query.stock === "all" ? undefined : query.stock);

    const conditions = await buildProductConditions({
      categorySlug: query.category,
      search: query.search,
      minCents,
      maxCents,
      brandSlugs,
      stock,
    });

    const whereClause = and(...conditions);

    let orderBy: SQL;
    switch (query.sort) {
      case "price-asc":
        orderBy = asc(products.priceCents);
        break;
      case "price-desc":
        orderBy = desc(products.priceCents);
        break;
      case "newest":
        orderBy = desc(products.createdAt);
        break;
      case "name":
        orderBy = asc(products.name);
        break;
      default:
        orderBy = desc(sql`coalesce(${products.featuredRank}, 0)`);
    }

    const cols = getTableColumns(products);
    const [rows, countResult] = await Promise.all([
      db
        .select({
          ...cols,
          brand: sql<string>`coalesce(${brands.name}, 'Other')`,
          categorySlug: categories.slug,
        })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .orderBy(orderBy, asc(products.id))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(distinct ${products.id})::int` })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    res.json({
      products: rows,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || (total > 0 ? 1 : 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Product by slug ──

router.get("/products/:slug", optionalAuth, async (req, res, next) => {
  try {
    const slug = param(req, "slug");
    const cols = getTableColumns(products);
    const [row] = await db
      .select({
        ...cols,
        brand: sql<string>`coalesce(${brands.name}, 'Other')`,
        categorySlug: categories.slug,
        categoryTitle: categories.title,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "NOT_FOUND", message: "Product not found" });
      return;
    }

    const relatedCols = getTableColumns(products);
    const related = await db
      .select({
        ...relatedCols,
        brand: sql<string>`coalesce(${brands.name}, 'Other')`,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(eq(products.categoryId, row.categoryId), sql`${products.id} != ${row.id}`, eq(products.isActive, true)),
      )
      .orderBy(desc(sql`coalesce(${products.featuredRank}, 0)`), asc(products.name))
      .limit(4);

    res.json({ product: row, related });
  } catch (err) {
    next(err);
  }
});

export default router;
