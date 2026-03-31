import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";
import ProductCard from "../components/shop/ProductCard.jsx";
import { useAuth } from "../auth/useAuth.js";

const pageTop = "pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]";

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown>} row */
function favRowToProduct(row) {
  const images = Array.isArray(row.images) ? row.images : [];
  const img = (typeof row.image === "string" && row.image) || (typeof images[0] === "string" ? images[0] : "") || "";
  return {
    slug: row.slug,
    name: row.name,
    brand: typeof row.brand === "string" && row.brand ? row.brand : "Other",
    priceCents: row.priceCents,
    compareAtCents: row.compareAtCents ?? undefined,
    shortDescription: typeof row.shortDescription === "string" ? row.shortDescription : "",
    stock: typeof row.stock === "number" ? row.stock : 0,
    image: img,
    badge: row.badge ?? undefined,
  };
}

export default function FavoritesPage() {
  const { authorizedFetch } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authorizedFetch("/api/v1/profile/favorites");
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Could not load favorites");
      setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load favorites");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const removeFavorite = async (productId) => {
    setRemovingId(productId);
    try {
      const res = await authorizedFetch(`/api/v1/profile/favorites/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Could not remove");
      setFavorites((prev) => prev.filter((f) => f.id !== productId));
      toast.success("Removed from favorites");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className={`mx-auto w-full max-w-[min(100%,1200px)] px-4 pb-20 md:px-6 lg:px-8 ${pageTop}`}>
      <div className="mb-8">
        <h1 className="font-ui-medium text-3xl tracking-tight text-[color:var(--ink)] md:text-4xl">Favorites</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
          Products you saved for later. Remove anytime with the heart control on each card.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Loading…</p>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-[color:color-mix(in_srgb,var(--ink)_35%,transparent)]" strokeWidth={1.5} aria-hidden />
          <p className="mt-4 font-medium text-[color:var(--ink)]">No favorites yet</p>
          <p className="mt-2 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
            Browse the shop and tap the heart on a product page to save it here.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-xl bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-[color:var(--paper)]"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((row) => {
            const product = favRowToProduct(row);
            const busy = removingId === row.id;
            return (
              <div key={row.favoriteId ?? row.id} className="relative">
                <button
                  type="button"
                  className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity hover:bg-black/65 disabled:opacity-50"
                  aria-label="Remove from favorites"
                  disabled={busy}
                  onClick={() => void removeFavorite(row.id)}
                >
                  <Heart className="h-4 w-4 fill-current" strokeWidth={2} aria-hidden />
                </button>
                {!row.isActive ? (
                  <p className="mb-2 rounded-lg bg-amber-100 px-2 py-1 text-center text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                    No longer available for purchase
                  </p>
                ) : null}
                <ProductCard product={product} showFavoriteToggle={false} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
