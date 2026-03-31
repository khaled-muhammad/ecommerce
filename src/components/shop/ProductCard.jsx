import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { formatUsd } from "../../lib/money.js";
import { useCart } from "../../cart/useCart.js";
import { useAuth } from "../../auth/useAuth.js";
import { isProductUuid } from "../../cart/cartApi.js";

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   product: import('../../data/products.js').ShopProduct,
 *   showFavoriteToggle?: boolean,
 * }} props
 */
export default function ProductCard({ product, showFavoriteToggle = true }) {
  const { user, authorizedFetch } = useAuth();
  const { addItem, openSideCart } = useCart();
  const inStock = product.stock > 0;
  const href = `/shop/product/${product.slug}`;

  const productId = product.id;
  const canFavorite = Boolean(user && showFavoriteToggle && isProductUuid(productId));

  const [favorited, setFavorited] = useState(false);
  const [favStatusLoading, setFavStatusLoading] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    if (!canFavorite || !productId) {
      setFavorited(false);
      setFavStatusLoading(false);
      return;
    }
    const ac = new AbortController();
    setFavStatusLoading(true);
    void (async () => {
      try {
        const res = await authorizedFetch(
          `/api/v1/profile/favorites/status?productId=${encodeURIComponent(String(productId))}`,
        );
        if (ac.signal.aborted) return;
        const data = await parseJson(res);
        if (!ac.signal.aborted) setFavorited(Boolean(data?.favorited));
      } catch {
        if (!ac.signal.aborted) setFavorited(false);
      } finally {
        if (!ac.signal.aborted) setFavStatusLoading(false);
      }
    })();
    return () => ac.abort();
  }, [canFavorite, productId, authorizedFetch]);

  const toggleFavorite = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canFavorite || !productId || favBusy) return;
      const pid = String(productId);
      const next = !favorited;
      setFavorited(next);
      setFavBusy(true);
      try {
        if (next) {
          const res = await authorizedFetch("/api/v1/profile/favorites", {
            method: "POST",
            body: JSON.stringify({ productId: pid }),
          });
          const data = await parseJson(res);
          if (!res.ok) throw new Error(data?.message ?? "Could not save favorite");
        } else {
          const res = await authorizedFetch(`/api/v1/profile/favorites/${encodeURIComponent(pid)}`, {
            method: "DELETE",
          });
          const data = await parseJson(res);
          if (!res.ok && res.status !== 404) throw new Error(data?.message ?? "Could not remove favorite");
        }
      } catch (err) {
        setFavorited(!next);
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setFavBusy(false);
      }
    },
    [canFavorite, productId, favorited, favBusy, authorizedFetch],
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] shadow-sm transition-[box-shadow,transform] hover:shadow-md">
      <div className="relative aspect-[5/6] overflow-hidden bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
        <Link to={href} className="relative block h-full w-full">
          <img
            src={product.image || "https://images.unsplash.com/photo-1597872200969-cb565ebd4a7f?w=600&auto=format&fit=crop&q=70"}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
            aria-hidden
          />
          {product.badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {product.badge}
            </span>
          ) : null}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/85">{product.brand}</p>
            <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-white drop-shadow-sm sm:text-base">
              {product.name}
            </h3>
          </div>
        </Link>
        {canFavorite ? (
          <button
            type="button"
            onClick={(e) => void toggleFavorite(e)}
            disabled={favStatusLoading || favBusy}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity hover:bg-black/65 disabled:opacity-50"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorited}
          >
            <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums text-[color:var(--ink)]">{formatUsd(product.priceCents)}</span>
          {product.compareAtCents && product.compareAtCents > product.priceCents ? (
            <span className="text-sm tabular-nums text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] line-through">
              {formatUsd(product.compareAtCents)}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 flex-1 text-[13px] leading-snug text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
          {product.shortDescription}
        </p>
        <div className="flex items-center gap-2">
          <Link
            to={href}
            className="flex-1 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] py-2.5 text-center text-sm font-semibold text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]"
          >
            Details
          </Link>
          <button
            type="button"
            disabled={!inStock}
            onClick={(e) => {
              e.preventDefault();
              addItem(product, 1);
              openSideCart();
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--ink)] text-[color:var(--paper)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        {!inStock ? (
          <p className="text-center text-xs font-medium text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
            Out of stock
          </p>
        ) : product.stock <= 5 ? (
          <p className="text-center text-xs font-medium text-amber-700 dark:text-amber-400">Only {product.stock} left</p>
        ) : null}
      </div>
    </article>
  );
}
