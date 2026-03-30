import { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext, CART_STORAGE_KEY } from "./cart-context.js";
import { getProductById } from "../data/products.js";

/** @param {Record<string, unknown>} product */
function snapshotFromProduct(product) {
  if (!product) return undefined;
  const images = Array.isArray(product.images) ? product.images : [];
  const img =
    (typeof product.image === "string" && product.image) || (typeof images[0] === "string" ? images[0] : "") || "";
  return {
    name: String(product.name ?? ""),
    slug: String(product.slug ?? ""),
    priceCents: Number(product.priceCents ?? 0),
    compareAtCents:
      product.compareAtCents != null && Number.isFinite(Number(product.compareAtCents))
        ? Number(product.compareAtCents)
        : undefined,
    image: img,
    brand: String(product.brand ?? ""),
    stock: Math.max(0, Math.floor(Number(product.stock ?? 0))),
    shortDescription: String(product.shortDescription ?? ""),
  };
}

function readStored() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.items)) return [];
    return data.items.filter(
      (l) => l && typeof l.productId === "string" && typeof l.quantity === "number" && l.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored);
  const [sideCartOpen, setSideCartOpen] = useState(false);

  const openSideCart = useCallback(() => setSideCartOpen(true), []);
  const closeSideCart = useCallback(() => setSideCartOpen(false), []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    if (!product?.id || product.stock < 1) return;
    const add = Math.max(1, Math.floor(qty));
    const snap = snapshotFromProduct(product);
    setItems((prev) => {
      const next = [...prev];
      const i = next.findIndex((l) => l.productId === product.id);
      const current = i >= 0 ? next[i].quantity : 0;
      const merged = Math.min(product.stock, current + add);
      if (i >= 0) {
        next[i] = { ...next[i], quantity: merged, snapshot: snap ?? next[i].snapshot };
      } else {
        next.push({ productId: product.id, quantity: merged, snapshot: snap });
      }
      return next.filter((l) => l.quantity > 0);
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) => {
      const line = prev.find((l) => l.productId === productId);
      const fromSnap = line?.snapshot?.stock;
      const fromStatic = getProductById(productId)?.stock;
      const max = (typeof fromSnap === "number" ? fromSnap : fromStatic) ?? 0;
      const q = Math.min(max, Math.max(0, Math.floor(quantity)));
      if (q <= 0) return prev.filter((l) => l.productId !== productId);
      const i = prev.findIndex((l) => l.productId === productId);
      if (i < 0) return q > 0 ? [...prev, { productId, quantity: q }] : prev;
      const next = [...prev];
      next[i] = { ...next[i], quantity: q };
      return next;
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((s, l) => s + l.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      sideCartOpen,
      openSideCart,
      closeSideCart,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, itemCount, sideCartOpen, openSideCart, closeSideCart, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
