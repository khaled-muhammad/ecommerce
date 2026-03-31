import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronRight, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { fetchProductBySlug } from "../lib/catalogApi.js";
import { formatUsd } from "../lib/money.js";
import { useCart } from "../cart/useCart.js";
import { useAuth } from "../auth/useAuth.js";
import ProductCard from "../components/shop/ProductCard.jsx";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1597872200969-cb565ebd4a7f?w=800&auto=format&fit=crop&q=80";

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown>} p */
function productFromApiDetail(p) {
  const images = Array.isArray(p.images) ? p.images : [];
  const img = (typeof p.image === "string" && p.image) || images[0] || PLACEHOLDER_IMG;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? "Other",
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents ?? undefined,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    specs: p.specs && typeof p.specs === "object" ? p.specs : {},
    stock: p.stock ?? 0,
    image: img,
    images: images.length ? images : [img],
    badge: p.badge ?? undefined,
    featuredRank: p.featuredRank ?? 0,
    categoryId: p.categorySlug ?? "",
    categoryTitle: p.categoryTitle ?? "",
  };
}

/** @param {Record<string, unknown>} p */
function relatedFromApi(p) {
  const images = Array.isArray(p.images) ? p.images : [];
  const img = (typeof p.image === "string" && p.image) || images[0] || PLACEHOLDER_IMG;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? "Other",
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents ?? undefined,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    specs: p.specs && typeof p.specs === "object" ? p.specs : {},
    stock: p.stock ?? 0,
    image: img,
    images: images.length ? images : [img],
    badge: p.badge ?? undefined,
    featuredRank: p.featuredRank ?? 0,
    categoryId: p.categorySlug ?? "",
  };
}

export default function ProductPage() {
  const { slug } = useParams();
  const { user, authorizedFetch } = useAuth();
  const { addItem, openSideCart } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [favorited, setFavorited] = useState(false);
  const [favStatusLoading, setFavStatusLoading] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setProduct(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetchProductBySlug(slug, ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return;
        if (!data?.product) {
          setProduct(null);
          setRelated([]);
          return;
        }
        setProduct(productFromApiDetail(data.product));
        setRelated((data.related ?? []).map(relatedFromApi));
      })
      .catch((e) => {
        if (e?.name === "AbortError" || ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setProduct(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [slug]);

  const gallery = useMemo(() => {
    if (!product) return [];
    return product.images?.length ? product.images : [product.image];
  }, [product]);

  useEffect(() => {
    setActiveImage(0);
    setQty(1);
  }, [slug, product?.id]);

  useEffect(() => {
    if (!user || !product?.id) {
      setFavorited(false);
      setFavStatusLoading(false);
      return;
    }
    const ac = new AbortController();
    setFavStatusLoading(true);
    void (async () => {
      try {
        const res = await authorizedFetch(
          `/api/v1/profile/favorites/status?productId=${encodeURIComponent(String(product.id))}`,
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
  }, [user, product?.id, authorizedFetch]);

  const toggleFavorite = useCallback(async () => {
    if (!user || !product?.id || favBusy) return;
    const pid = String(product.id);
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
    } catch (e) {
      setFavorited(!next);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setFavBusy(false);
    }
  }, [user, product, favorited, favBusy, authorizedFetch]);

  if (!slug) {
    return <Navigate to="/shop" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[min(100%,1200px)] px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:px-6 lg:px-8">
        <p className="mt-10 text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return <Navigate to="/shop" replace />;
  }

  const inStock = product.stock > 0;
  const maxQty = product.stock;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(product, qty);
    openSideCart();
    setQty(1);
  };

  return (
    <div className="mx-auto mt-5 w-full max-w-[min(100%,1200px)] px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
        <Link to="/shop" className="hover:text-[color:var(--ink)] hover:underline">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <Link
          to={`/shop?category=${encodeURIComponent(product.categoryId)}`}
          className="hover:text-(--ink) hover:underline"
        >
          {product.categoryTitle || product.categoryId}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="line-clamp-1 font-medium text-(--ink)">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]">
            {user ? (
              <button
                type="button"
                onClick={() => void toggleFavorite()}
                disabled={favStatusLoading || favBusy}
                className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-opacity hover:bg-black/60 disabled:opacity-50"
                aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={favorited}
              >
                <Heart
                  className={`h-5 w-5 ${favorited ? "fill-current" : ""}`}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            ) : null}
            <img src={gallery[activeImage]} alt="" className="aspect-square w-full object-cover" />
          </div>
          {gallery.length > 1 ? (
            <div className="mt-3 flex gap-2">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === activeImage
                      ? "border-[color:var(--ink)]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
            {product.brand}
          </p>
          <h1 className="mt-1 font-ui-medium text-3xl tracking-[-0.03em] text-(--ink) md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums text-(--ink)">{formatUsd(product.priceCents)}</span>
            {product.compareAtCents && product.compareAtCents > product.priceCents ? (
              <span className="text-lg tabular-nums text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] line-through">
                {formatUsd(product.compareAtCents)}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_78%,transparent)]">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]">
              <button
                type="button"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-l-xl text-(--ink) transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] disabled:opacity-35"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 text-center text-sm font-bold tabular-nums text-(--ink)">{qty}</span>
              <button
                type="button"
                disabled={!inStock || qty >= maxQty}
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-r-xl text-(--ink) transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] disabled:opacity-35"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={!inStock}
              onClick={handleAddToCart}
              className="inline-flex min-[400px]:min-w-50 flex-1 items-center justify-center gap-2 rounded-xl bg-(--ink) px-6 py-3 text-sm font-semibold text-(--paper) transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </button>
          </div>

          <p className="mt-3 text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
            {inStock ? (
              <>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">In stock</span>
                {product.stock <= 10 ? `  (only ${product.stock} available)` : null}
              </>
            ) : (
              <span className="font-medium text-red-700 dark:text-red-400">Out of stock</span>
            )}
          </p>

          <div className="mt-10">
            <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Specifications</h2>
            <dl className="mt-3 divide-y divide-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)]">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">{k}</dt>
                  <dd className="text-sm font-semibold text-[color:var(--ink)]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] pt-12">
          <h2 className="font-ui-medium text-2xl text-[color:var(--ink)]">More in this category</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
