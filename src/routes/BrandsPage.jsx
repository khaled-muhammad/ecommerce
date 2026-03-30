import { useEffect, useMemo, useState } from "react";
import ChromaGrid from "../components/ChromaGrid.jsx";
import { BRAND_GRID_ITEMS } from "../data/brandsGrid.js";
import { fetchBrands } from "../lib/catalogApi.js";

function presentationForBrand(slug, name) {
  const hit = BRAND_GRID_ITEMS.find((b) => b.title.toLowerCase() === name.trim().toLowerCase());
  if (hit) {
    return {
      image: hit.image,
      imageDark: hit.imageDark,
      borderColor: hit.borderColor,
    };
  }
  return {
    image: `https://cdn.simpleicons.org/${encodeURIComponent(slug)}/737373`,
    borderColor: "#64748b",
  };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setLoading(true);
    fetchBrands()
      .then((rows) => {
        if (!cancelled) setBrands(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load brands");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const gridItems = useMemo(() => {
    return brands.map((b) => {
      const pres = presentationForBrand(b.slug, b.name);
      const logo = typeof b.logo === "string" && b.logo.trim() ? b.logo.trim() : null;
      return {
        title: b.name,
        image: logo || pres.image,
        imageDark: logo ? undefined : pres.imageDark,
        borderColor: pres.borderColor,
        to: `/shop?brand=${encodeURIComponent(b.slug)}`,
      };
    });
  }, [brands]);

  return (
    <div
      className="brands-page mx-auto flex w-full max-w-[min(100%,1600px)] flex-col px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:px-6 lg:px-8"
    >
      <header className="mb-10 max-w-xl">
        <h1 className="font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">
          Brands
        </h1>
        <p className="font-ui mt-2 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
          Parts and systems from manufacturers we stand behind, same names you see on retail shelves and
          enterprise quotes.
        </p>
      </header>

      {loadError ? (
        <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {loadError}
        </p>
      ) : null}

      <div className="relative min-h-[min(72dvh,920px)] w-full flex-1">
        {loading ? (
          <div
            className="chroma-grid chroma-grid--brands mx-auto w-full max-w-none"
            aria-busy="true"
            aria-label="Loading brands"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="chroma-card chroma-card--brand w-full max-w-[200px] animate-pulse rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                style={{ aspectRatio: "1 / 1.15" }}
              />
            ))}
          </div>
        ) : gridItems.length === 0 ? (
          <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">No brands to show.</p>
        ) : (
          <ChromaGrid
            variant="brands"
            items={gridItems}
            radius={320}
            damping={0.45}
            fadeOut={0.55}
            ease="power3.out"
          />
        )}
      </div>
    </div>
  );
}
