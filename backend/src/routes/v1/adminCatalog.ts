import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq, and, or, ilike, sql, desc, asc, getTableColumns } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, brands, products } from "../../db/schema/catalog.js";
import { requireAuth } from "../../middleware/auth.js";
import { mayAccessStaffCapability } from "../../lib/storeOwnerAccess.js";

const router = Router();

/** Delegated catalog admins (store owner always allowed - see mayAccessStaffCapability) */
const CATALOG_ADMIN = new Set(["admin"]);

function requireCatalogAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !mayAccessStaffCapability(req.user.role, CATALOG_ADMIN)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Catalog admin access required" });
    return;
  }
  next();
}

const uuidParam = z.string().uuid();

// ── Categories ──

router.get("/categories", requireAuth, requireCatalogAdmin, async (_req, res, next) => {
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.title));
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

const createCategorySchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
  image: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

router.post("/categories", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const body = createCategorySchema.parse(req.body);
    const [dup] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, body.slug)).limit(1);
    if (dup) {
      res.status(409).json({ error: "CONFLICT", message: "Category slug already exists" });
      return;
    }
    const [row] = await db
      .insert(categories)
      .values({
        slug: body.slug,
        title: body.title,
        description: body.description ?? null,
        image: body.image ?? null,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      })
      .returning();
    res.status(201).json({ category: row });
  } catch (err) {
    next(err);
  }
});

const patchCategorySchema = createCategorySchema.partial().extend({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  title: z.string().min(1).max(200).optional(),
});

router.patch("/categories/:id", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const id = uuidParam.parse(req.params.id);
    const body = patchCategorySchema.parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: "BAD_REQUEST", message: "No fields to update" });
      return;
    }
    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "NOT_FOUND", message: "Category not found" });
      return;
    }
    if (body.slug != null && body.slug !== existing.slug) {
      const [dup] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, body.slug)).limit(1);
      if (dup) {
        res.status(409).json({ error: "CONFLICT", message: "Category slug already exists" });
        return;
      }
    }
    const [row] = await db
      .update(categories)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    res.json({ category: row });
  } catch (err) {
    next(err);
  }
});

// ── Brands ──

router.get("/brands", requireAuth, requireCatalogAdmin, async (_req, res, next) => {
  try {
    const rows = await db.select().from(brands).orderBy(asc(brands.name));
    res.json({ brands: rows });
  } catch (err) {
    next(err);
  }
});

const createBrandSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  logo: z.string().max(2000).optional().nullable(),
  website: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

router.post("/brands", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const body = createBrandSchema.parse(req.body);
    const website = body.website?.trim() ? body.website.trim() : null;
    const [dupSlug] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, body.slug)).limit(1);
    if (dupSlug) {
      res.status(409).json({ error: "CONFLICT", message: "Brand slug already exists" });
      return;
    }
    const [dupName] = await db.select({ id: brands.id }).from(brands).where(eq(brands.name, body.name)).limit(1);
    if (dupName) {
      res.status(409).json({ error: "CONFLICT", message: "Brand name already exists" });
      return;
    }
    const [row] = await db
      .insert(brands)
      .values({
        name: body.name,
        slug: body.slug,
        logo: body.logo ?? null,
        website,
        isActive: body.isActive,
      })
      .returning();
    res.status(201).json({ brand: row });
  } catch (err) {
    next(err);
  }
});

const patchBrandSchema = createBrandSchema.partial();

router.patch("/brands/:id", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const id = uuidParam.parse(req.params.id);
    const raw = patchBrandSchema.parse(req.body);
    if (Object.keys(raw).length === 0) {
      res.status(400).json({ error: "BAD_REQUEST", message: "No fields to update" });
      return;
    }
    const body = {
      ...raw,
      ...(raw.website !== undefined
        ? { website: typeof raw.website === "string" && raw.website.trim() ? raw.website.trim() : null }
        : {}),
    };
    const [existing] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "NOT_FOUND", message: "Brand not found" });
      return;
    }
    if (body.slug != null && body.slug !== existing.slug) {
      const [dup] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, body.slug)).limit(1);
      if (dup) {
        res.status(409).json({ error: "CONFLICT", message: "Brand slug already exists" });
        return;
      }
    }
    if (body.name != null && body.name !== existing.name) {
      const [dup] = await db.select({ id: brands.id }).from(brands).where(eq(brands.name, body.name)).limit(1);
      if (dup) {
        res.status(409).json({ error: "CONFLICT", message: "Brand name already exists" });
        return;
      }
    }
    const [row] = await db.update(brands).set(body).where(eq(brands.id, id)).returning();
    res.json({ brand: row });
  } catch (err) {
    next(err);
  }
});

// ── Products ──

const listAdminProductsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
  search: z.string().optional(),
  isActive: z.enum(["all", "true", "false"]).optional().default("all"),
});

router.get("/products", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const query = listAdminProductsSchema.parse(req.query);
    const offset = (query.page - 1) * query.limit;
    const conditions = [];
    if (query.isActive === "true") conditions.push(eq(products.isActive, true));
    if (query.isActive === "false") conditions.push(eq(products.isActive, false));
    const search = query.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(or(ilike(products.name, pattern), ilike(products.slug, pattern))!);
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;
    const cols = getTableColumns(products);
    const [rows, countResult] = await Promise.all([
      db
        .select({
          ...cols,
          brandName: sql<string>`coalesce(${brands.name}, '')`,
          categorySlug: categories.slug,
          categoryTitle: categories.title,
        })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause ?? sql`true`)
        .orderBy(desc(sql`coalesce(${products.featuredRank}, 0)`), asc(products.name))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(whereClause ?? sql`true`),
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

router.get("/products/:id", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const id = uuidParam.parse(req.params.id);
    const cols = getTableColumns(products);
    const [row] = await db
      .select({
        ...cols,
        brandName: sql<string>`coalesce(${brands.name}, '')`,
        categorySlug: categories.slug,
        categoryTitle: categories.title,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND", message: "Product not found" });
      return;
    }
    res.json({ product: row });
  } catch (err) {
    next(err);
  }
});

const specsSchema = z.record(z.string(), z.string()).optional().nullable();
const imagesSchema = z.array(z.string()).optional().nullable();

const createProductSchema = z.object({
  slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(300),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional().nullable(),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).optional().nullable(),
  shortDescription: z.string().min(1).max(2000),
  description: z.string().min(1).max(20000),
  specs: specsSchema,
  stock: z.number().int().min(0).optional().default(0),
  image: z.string().max(2000).optional().nullable(),
  images: imagesSchema,
  badge: z.string().max(120).optional().nullable(),
  featuredRank: z.number().int().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

router.post("/products", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const body = createProductSchema.parse(req.body);
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, body.categoryId)).limit(1);
    if (!cat) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Invalid categoryId" });
      return;
    }
    if (body.brandId) {
      const [b] = await db.select({ id: brands.id }).from(brands).where(eq(brands.id, body.brandId)).limit(1);
      if (!b) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Invalid brandId" });
        return;
      }
    }
    const [dup] = await db.select({ id: products.id }).from(products).where(eq(products.slug, body.slug)).limit(1);
    if (dup) {
      res.status(409).json({ error: "CONFLICT", message: "Product slug already exists" });
      return;
    }
    const [row] = await db
      .insert(products)
      .values({
        slug: body.slug,
        name: body.name,
        categoryId: body.categoryId,
        brandId: body.brandId ?? null,
        priceCents: body.priceCents,
        compareAtCents: body.compareAtCents ?? null,
        shortDescription: body.shortDescription,
        description: body.description,
        specs: body.specs ?? null,
        stock: body.stock,
        image: body.image ?? null,
        images: body.images ?? [],
        badge: body.badge ?? null,
        featuredRank: body.featuredRank ?? null,
        isActive: body.isActive,
      })
      .returning();
    res.status(201).json({ product: row });
  } catch (err) {
    next(err);
  }
});

const patchProductSchema = createProductSchema.partial();

router.patch("/products/:id", requireAuth, requireCatalogAdmin, async (req, res, next) => {
  try {
    const id = uuidParam.parse(req.params.id);
    const body = patchProductSchema.parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: "BAD_REQUEST", message: "No fields to update" });
      return;
    }
    const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "NOT_FOUND", message: "Product not found" });
      return;
    }
    if (body.slug != null && body.slug !== existing.slug) {
      const [dup] = await db.select({ id: products.id }).from(products).where(eq(products.slug, body.slug)).limit(1);
      if (dup) {
        res.status(409).json({ error: "CONFLICT", message: "Product slug already exists" });
        return;
      }
    }
    if (body.categoryId != null) {
      const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, body.categoryId)).limit(1);
      if (!cat) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Invalid categoryId" });
        return;
      }
    }
    if (body.brandId !== undefined && body.brandId !== null) {
      const [b] = await db.select({ id: brands.id }).from(brands).where(eq(brands.id, body.brandId)).limit(1);
      if (!b) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Invalid brandId" });
        return;
      }
    }
    const [row] = await db
      .update(products)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    res.json({ product: row });
  } catch (err) {
    next(err);
  }
});

export default router;
