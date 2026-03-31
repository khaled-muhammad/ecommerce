import { apiUrl } from "./apiUrl.js";

/** Shop/catalog fetch helpers (`credentials: "include"`). */

export async function fetchCategories() {
  const res = await fetch(apiUrl("/api/v1/categories"), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
  const data = await res.json();
  const list = data.categories;
  if (!Array.isArray(list)) throw new Error("Invalid categories response");
  return list;
}

export async function fetchBrands() {
  const res = await fetch(apiUrl("/api/v1/brands"), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to load brands (${res.status})`);
  const data = await res.json();
  const list = data.brands;
  if (!Array.isArray(list)) throw new Error("Invalid brands response");
  return list;
}

export function buildShopListSearchParams(args) {
  const sp = new URLSearchParams();
  const cat = args.category;
  if (cat && cat !== "all") sp.set("category", cat);
  for (const s of args.brandSlugs ?? []) {
    if (s) sp.append("brand", s);
  }
  if (args.search?.trim()) sp.set("search", args.search.trim());
  if (args.sort) sp.set("sort", args.sort);
  if (args.min) sp.set("min", args.min);
  if (args.max) sp.set("max", args.max);
  if (args.stock === "in") sp.set("stock", "in");
  if (args.stock === "out") sp.set("stock", "out");
  sp.set("page", String(args.page ?? 1));
  sp.set("limit", String(args.limit ?? 24));
  return sp;
}

export function buildShopFacetsSearchParams(args) {
  const sp = new URLSearchParams();
  const cat = args.category;
  if (cat && cat !== "all") sp.set("category", cat);
  if (args.search?.trim()) sp.set("search", args.search.trim());
  if (args.min) sp.set("min", args.min);
  if (args.max) sp.set("max", args.max);
  if (args.stock === "in") sp.set("stock", "in");
  if (args.stock === "out") sp.set("stock", "out");
  return sp;
}

export async function fetchShopProducts(args, signal) {
  const sp = buildShopListSearchParams(args);
  const res = await fetch(apiUrl(`/api/v1/products?${sp}`), { credentials: "include", signal });
  if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
  return res.json();
}

export async function fetchShopFacets(args, signal) {
  const sp = buildShopFacetsSearchParams(args);
  const res = await fetch(apiUrl(`/api/v1/products/facets?${sp}`), { credentials: "include", signal });
  if (!res.ok) throw new Error(`Failed to load filters (${res.status})`);
  return res.json();
}

export async function fetchSearchSuggestions(q, signal) {
  const t = q.trim();
  if (t.length < 2) return { suggestions: [] };
  const sp = new URLSearchParams({ q: t, limit: "10" });
  const res = await fetch(apiUrl(`/api/v1/products/search-suggestions?${sp}`), {
    credentials: "include",
    signal,
  });
  if (!res.ok) return { suggestions: [] };
  return res.json();
}

export async function fetchProductBySlug(slug, signal) {
  const res = await fetch(apiUrl(`/api/v1/products/${encodeURIComponent(slug)}`), {
    credentials: "include",
    signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load product (${res.status})`);
  return res.json();
}
