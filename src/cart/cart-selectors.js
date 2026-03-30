import { useMemo } from "react";
import { getProductById } from "../data/products.js";
import { useCart } from "./useCart.js";

/** @param {{ productId: string, quantity: number, snapshot?: Record<string, unknown> }} line */
function lineProduct(line) {
  const staticP = getProductById(line.productId);
  if (staticP) return staticP;
  const s = line.snapshot;
  if (s && typeof s === "object" && s.slug) {
    return {
      id: line.productId,
      slug: String(s.slug),
      name: String(s.name ?? ""),
      categoryId: "",
      brand: String(s.brand ?? ""),
      priceCents: Number(s.priceCents ?? 0),
      compareAtCents: s.compareAtCents != null ? Number(s.compareAtCents) : undefined,
      shortDescription: String(s.shortDescription ?? ""),
      description: String(s.shortDescription ?? ""),
      specs: {},
      stock: Math.max(0, Math.floor(Number(s.stock ?? 0))),
      image: String(s.image ?? ""),
      images: s.image ? [String(s.image)] : [],
      badge: undefined,
      featuredRank: 0,
    };
  }
  return null;
}

export function useCartLines() {
  const { items } = useCart();
  return useMemo(() => {
    const lines = [];
    for (const l of items) {
      const product = lineProduct(l);
      if (product) {
        lines.push({
          ...l,
          product,
          lineTotalCents: product.priceCents * l.quantity,
        });
      }
    }
    return lines;
  }, [items]);
}

export function useCartSubtotalCents() {
  const lines = useCartLines();
  return useMemo(() => lines.reduce((s, l) => s + l.lineTotalCents, 0), [lines]);
}
