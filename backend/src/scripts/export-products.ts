/**
 * Export all products to JSON with category/brand slugs (portable across DBs).
 *
 * Usage (from backend/, uses backend/.env DATABASE_URL):
 *   npm run products:export
 *   npm run products:export -- --out ./my-products.json
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { brands, categories, products } from "../db/schema/catalog.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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
    console.log(`export-products — write all products to JSON (categorySlug / brandSlug for import).

Usage:
  npm run products:export
  npm run products:export -- --out ./products.export.json
`);
    process.exit(0);
  }

  const outFile =
    typeof args.out === "string"
      ? path.isAbsolute(args.out)
        ? args.out
        : path.resolve(process.cwd(), args.out)
      : path.join(backendRoot, "products.export.json");

  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      categorySlug: categories.slug,
      brandSlug: brands.slug,
      priceCents: products.priceCents,
      compareAtCents: products.compareAtCents,
      shortDescription: products.shortDescription,
      description: products.description,
      specs: products.specs,
      stock: products.stock,
      image: products.image,
      images: products.images,
      badge: products.badge,
      featuredRank: products.featuredRank,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id));

  const payload = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Exported ${payload.length} product(s) to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
