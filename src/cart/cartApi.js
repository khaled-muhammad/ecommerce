import { apiUrl } from "../lib/apiUrl.js";

export const CART_SESSION_STORAGE_KEY = "roxy_cart_session";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @param {unknown} id */
export function isProductUuid(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

export function ensureCartSessionId() {
  try {
    let id = localStorage.getItem(CART_SESSION_STORAGE_KEY);
    if (!id || typeof id !== "string") {
      id = crypto.randomUUID();
      localStorage.setItem(CART_SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** @param {Response} res */
export async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** @param {string | null | undefined} token */
function authHeaders(token) {
  const headers = { "X-Cart-Session": ensureCartSessionId() };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * @param {string | null | undefined} token
 * @param {AbortSignal | undefined} signal
 */
export async function apiGetCart(token, signal) {
  const res = await fetch(apiUrl("/api/v1/cart"), {
    credentials: "include",
    headers: authHeaders(token),
    signal,
  });
  const data = await parseJson(res);
  return { res, data };
}

/**
 * @param {string} token
 * @param {AbortSignal | undefined} signal
 */
export async function apiCartMerge(token, signal) {
  const headers = {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
  const res = await fetch(apiUrl("/api/v1/cart/merge"), {
    method: "POST",
    credentials: "include",
    headers,
    body: "{}",
    signal,
  });
  const data = await parseJson(res);
  return { res, data };
}

/**
 * @param {string | null | undefined} token
 * @param {string} productId
 * @param {number} quantity
 * @param {AbortSignal | undefined} signal
 */
export async function apiCartAdd(token, productId, quantity, signal) {
  const headers = {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
  const res = await fetch(apiUrl("/api/v1/cart/add"), {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ productId, quantity }),
    signal,
  });
  const data = await parseJson(res);
  return { res, data };
}

/**
 * @param {string | null | undefined} token
 * @param {string} lineId
 * @param {number} quantity
 * @param {AbortSignal | undefined} signal
 */
export async function apiCartPatch(token, lineId, quantity, signal) {
  const headers = {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
  const res = await fetch(apiUrl(`/api/v1/cart/${encodeURIComponent(lineId)}`), {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({ quantity }),
    signal,
  });
  const data = await parseJson(res);
  return { res, data };
}

/**
 * @param {string | null | undefined} token
 * @param {string} lineId
 * @param {AbortSignal | undefined} signal
 */
export async function apiCartDeleteLine(token, lineId, signal) {
  const res = await fetch(apiUrl(`/api/v1/cart/${encodeURIComponent(lineId)}`), {
    method: "DELETE",
    credentials: "include",
    headers: authHeaders(token),
    signal,
  });
  const data = await parseJson(res);
  return { res, data };
}

/** @param {Record<string, unknown>} row */
export function serverLineToItem(row) {
  const brand = typeof row.brand === "string" && row.brand ? row.brand : "Other";
  return {
    productId: String(row.productId),
    quantity: Number(row.quantity) || 0,
    lineId: typeof row.id === "string" ? row.id : undefined,
    snapshot: {
      name: String(row.name ?? ""),
      slug: String(row.slug ?? ""),
      brand,
      priceCents: Number(row.priceCents ?? 0),
      compareAtCents:
        row.compareAtCents != null && Number.isFinite(Number(row.compareAtCents))
          ? Number(row.compareAtCents)
          : undefined,
      image: String(row.image ?? ""),
      stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
      shortDescription: "",
    },
  };
}

/**
 * @param {unknown[]} serverRows
 * @param {{ productId: string, quantity: number, lineId?: string, snapshot?: Record<string, unknown> }[]} localAll
 */
export function mergeServerLinesWithLocalNonUuid(serverRows, localAll) {
  const serverItems = serverRows
    .filter((r) => r && typeof r === "object")
    .map((r) => serverLineToItem(/** @type {Record<string, unknown>} */ (r)));
  const nonUuid = localAll.filter((l) => !isProductUuid(l.productId));
  return [...serverItems, ...nonUuid];
}
