/**
 * Import products from JSON exported by export-products. Resolves category_id / brand_id by slug
 * on the target database (UUIDs can differ from the source).
 *
 * Usage (point DATABASE_URL at the target DB, e.g. deployment):
 *   npm run products:import -- --file ./products.export.json --clear
 *
 * --clear  Deletes all cart_items, then all products, then inserts from the file.
 *          Required when replacing the catalog; cart lines reference product rows.
 *
 * In production, set DATABASE_URL in the environment (backend/.env is not auto-loaded when NODE_ENV=production).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { brands, cartItems, categories, products } from "../db/schema/catalog.js";

const exportedProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  categorySlug: z.string().min(1),
  brandSlug: z.string().min(1).nullable().optional(),
  priceCents: z.number().int(),
  compareAtCents: z.number().int().nullable().optional(),
  shortDescription: z.string(),
  description: z.string(),
  specs: z.record(z.string()).nullable().optional(),
  stock: z.number().int().default(0),
  image: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  badge: z.string().nullable().optional(),
  featuredRank: z.number().int().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      out.help = true;
      continue;
    }
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`import-products — load JSON from export-products; remap FKs by slug.

Usage:
  npm run products:import -- --file ./products.export.json --clear

Options:
  --file <path>   JSON file (required)
  --clear         Remove all cart_items and products before insert
  --dry-run       Validate file and slugs only; no writes

Ensure categories and brands with matching slugs exist on the target DB before importing.
`);
    process.exit(0);
  }

  const fileArg = args.file;
  if (typeof fileArg !== "string" || !fileArg) {
    console.error("Missing --file <path>");
    process.exit(1);
  }

  const filePath = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  const parsed = z.array(exportedProductSchema).safeParse(raw);
  if (!parsed.success) {
    console.error("Invalid JSON:", parsed.error.flatten());
    process.exit(1);
  }

  const data = parsed.data;
  const dryRun = args["dry-run"] === true;

  const categorySlugs = [...new Set(data.map((r) => r.categorySlug))];
  const brandSlugs = [...new Set(data.map((r) => r.brandSlug).filter((s): s is string => Boolean(s)))];

  const catRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const brandRows = await db.select({ id: brands.id, slug: brands.slug }).from(brands);

  const categoryBySlug = new Map(catRows.map((c) => [c.slug, c.id]));
  const brandBySlug = new Map(brandRows.map((b) => [b.slug, b.id]));

  const missingCats = categorySlugs.filter((s) => !categoryBySlug.has(s));
  if (missingCats.length) {
    console.error("Missing categories on target DB (by slug):", missingCats.join(", "));
    process.exit(1);
  }

  const missingBrands = brandSlugs.filter((s) => !brandBySlug.has(s));
  if (missingBrands.length) {
    console.error("Missing brands on target DB (by slug):", missingBrands.join(", "));
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Dry run OK: ${data.length} product(s), file ${filePath}`);
    process.exit(0);
  }

  const clear = args.clear === true;
  if (!clear) {
    console.error("Refusing to import without --clear (avoids duplicate slug errors). Use --clear to replace the catalog.");
    process.exit(1);
  }

  await db.transaction(async (tx) => {
    await tx.delete(cartItems);
    await tx.delete(products);

    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const values = chunk.map((row) => {
        const categoryId = categoryBySlug.get(row.categorySlug)!;
        const brandId = row.brandSlug ? brandBySlug.get(row.brandSlug) ?? null : null;
        return {
          slug: row.slug,
          name: row.name,
          categoryId,
          brandId,
          priceCents: row.priceCents,
          compareAtCents: row.compareAtCents ?? null,
          shortDescription: row.shortDescription,
          description: row.description,
          specs: row.specs ?? null,
          stock: row.stock,
          image: row.image ?? null,
          images: row.images ?? [],
          badge: row.badge ?? null,
          featuredRank: row.featuredRank ?? null,
          isActive: row.isActive,
          createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
        };
      });
      await tx.insert(products).values(values);
    }
  });

  console.log(`Imported ${data.length} product(s) from ${filePath} (cart_items cleared, products replaced).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
