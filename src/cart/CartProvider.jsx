import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CartContext, CART_STORAGE_KEY } from "./cart-context.js";
import { getProductById } from "../data/products.js";
import { useAuth } from "../auth/useAuth.js";
import {
  apiGetCart,
  apiCartMerge,
  apiCartAdd,
  apiCartPatch,
  apiCartDeleteLine,
  isProductUuid,
  mergeServerLinesWithLocalNonUuid,
} from "./cartApi.js";

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

/**
 * Merge server cart with any UUID lines that only existed locally, then return full client items.
 * @param {() => string | null} getToken
 * @param {AbortSignal | undefined} signal
 */
async function reconcileCartWithLocal(getToken, signal) {
  const token = getToken() ?? null;
  if (token) {
    await apiCartMerge(token, signal).catch(() => {});
  }

  let { res, data } = await apiGetCart(token, signal);
  if (!res.ok) return null;

  const serverRows = Array.isArray(data?.items) ? data.items : [];
  const localAll = readStored();
  const localUuid = localAll.filter((l) => isProductUuid(l.productId));
  const byPid = new Map();
  for (const r of serverRows) {
    if (r && typeof r === "object" && "productId" in r) {
      byPid.set(/** @type {{ productId: string }} */ (r).productId, r);
    }
  }

  for (const l of localUuid) {
    const s = byPid.get(l.productId);
    const serverStock = s ? Math.max(0, Math.floor(Number(s.stock))) : 0;
    const snapStock = Math.max(0, Math.floor(Number(l.snapshot?.stock ?? 0)));
    const stockCap = s ? serverStock : snapStock > 0 ? snapStock : 99;
    const target = Math.min(stockCap, Math.max(l.quantity, s?.quantity ?? 0));

    if (!s && target > 0) {
      const addRes = await apiCartAdd(token, l.productId, target, signal);
      if (!addRes.res.ok) continue;
    } else if (s && s.quantity !== target) {
      const patchRes = await apiCartPatch(token, s.id, target, signal);
      if (!patchRes.res.ok) continue;
    }
  }

  ({ res, data } = await apiGetCart(token, signal));
  if (!res.ok) return null;
  const finalRows = Array.isArray(data?.items) ? data.items : [];
  return mergeServerLinesWithLocalNonUuid(finalRows, readStored()).filter((l) => l.quantity > 0);
}

async function refreshCartFromServer(getToken) {
  const token = getToken() ?? null;
  const { res, data } = await apiGetCart(token);
  if (!res.ok) return null;
  return mergeServerLinesWithLocalNonUuid(Array.isArray(data?.items) ? data.items : [], readStored()).filter(
    (l) => l.quantity > 0,
  );
}

export function CartProvider({ children }) {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [items, setItems] = useState(() => readStored());
  const itemsRef = useRef(items);
  itemsRef.current = items;
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

  useEffect(() => {
    if (authLoading) return;
    const ac = new AbortController();
    void (async () => {
      try {
        const merged = await reconcileCartWithLocal(getAccessToken, ac.signal);
        if (!ac.signal.aborted && merged) setItems(merged);
      } catch {
        /* offline */
      }
    })();
    return () => ac.abort();
  }, [authLoading, user?.id, getAccessToken]);

  const addItem = useCallback(
    (product, qty = 1) => {
      if (!product?.id || product.stock < 1) return;
      const add = Math.max(1, Math.floor(qty));

      if (isProductUuid(product.id)) {
        void (async () => {
          try {
            const token = getAccessToken() ?? null;
            const { res } = await apiCartAdd(token, String(product.id), add);
            if (!res.ok) return;
            const next = await refreshCartFromServer(getAccessToken);
            if (next) setItems(next);
          } catch {
            /* ignore */
          }
        })();
        return;
      }

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
    },
    [getAccessToken],
  );

  const setQuantity = useCallback(
    (productId, quantity) => {
      if (isProductUuid(productId)) {
        void (async () => {
          try {
            const token = getAccessToken() ?? null;
            const line = itemsRef.current.find((l) => l.productId === productId);
            if (!line?.lineId) {
              setItems((prev) => {
                const ln = prev.find((l) => l.productId === productId);
                const fromSnap = ln?.snapshot?.stock;
                const fromStatic = getProductById(productId)?.stock;
                const max = (typeof fromSnap === "number" ? fromSnap : fromStatic) ?? 0;
                const q = Math.min(max, Math.max(0, Math.floor(quantity)));
                if (q <= 0) return prev.filter((l) => l.productId !== productId);
                const i = prev.findIndex((l) => l.productId === productId);
                if (i < 0) return prev;
                const next = [...prev];
                next[i] = { ...next[i], quantity: q };
                return next;
              });
              return;
            }

            const maxStock =
              typeof line.snapshot?.stock === "number"
                ? line.snapshot.stock
                : (getProductById(productId)?.stock ?? 0);
            const q = Math.min(maxStock, Math.max(0, Math.floor(quantity)));

            if (q <= 0) {
              const { res } = await apiCartDeleteLine(token, line.lineId);
              if (!res.ok) return;
            } else {
              const { res } = await apiCartPatch(token, line.lineId, q);
              if (!res.ok) return;
            }
            const next = await refreshCartFromServer(getAccessToken);
            if (next) setItems(next);
          } catch {
            /* ignore */
          }
        })();
        return;
      }

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
    },
    [getAccessToken],
  );

  const removeItem = useCallback(
    (productId) => {
      if (isProductUuid(productId)) {
        void (async () => {
          try {
            const token = getAccessToken() ?? null;
            const line = itemsRef.current.find((l) => l.productId === productId);
            if (line?.lineId) {
              const { res } = await apiCartDeleteLine(token, line.lineId);
              if (!res.ok) return;
              const next = await refreshCartFromServer(getAccessToken);
              if (next) setItems(next);
              return;
            }
            setItems((prev) => prev.filter((l) => l.productId !== productId));
          } catch {
            /* ignore */
          }
        })();
        return;
      }
      setItems((prev) => prev.filter((l) => l.productId !== productId));
    },
    [getAccessToken],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    void (async () => {
      try {
        const token = getAccessToken() ?? null;
        const { res, data } = await apiGetCart(token);
        if (!res.ok) return;
        const rows = Array.isArray(data?.items) ? data.items : [];
        for (const row of rows) {
          if (row && typeof row.id === "string") {
            await apiCartDeleteLine(token, row.id);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [getAccessToken]);

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
