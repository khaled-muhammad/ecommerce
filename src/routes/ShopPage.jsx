import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "../data/categories.js";
import { SHOP_CATEGORY_IDS } from "../data/products.js";
import {
  fetchCategories,
  fetchSearchSuggestions,
  fetchShopFacets,
  fetchShopProducts,
} from "../lib/catalogApi.js";
import ProductCard from "../components/shop/ProductCard.jsx";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

const FALLBACK_CATEGORY_ROWS = SHOP_CATEGORY_IDS.map((slug) => {
  const c = CATEGORIES.find((x) => x.id === slug);
  return { slug, title: c?.title ?? slug };
});

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1597872200969-cb565ebd4a7f?w=600&auto=format&fit=crop&q=70";

/** @param {Record<string, unknown>} p */
function shopProductFromApi(p) {
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

/**
 * @param {{
 *   category: string,
 *   search: string,
 *   sort: string,
 *   minPrice: string,
 *   maxPrice: string,
 *   stock: string | undefined,
 *   brandSlugs: string[],
 * }} props
 */
function ShopProductResults({ category, search, sort, minPrice, maxPrice, stock, brandSlugs }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  const stockApi = stock === "in" ? "in" : stock === "out" ? "out" : undefined;

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    const run = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const data = await fetchShopProducts(
          {
            category,
            brandSlugs,
            search,
            sort,
            min: minPrice,
            max: maxPrice,
            stock: stockApi,
            page,
            limit: 24,
          },
          ac.signal,
        );
        if (cancelled || ac.signal.aborted) return;
        const mapped = (data.products ?? []).map(shopProductFromApi);
        setRows((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
        const tp = data.pagination?.totalPages ?? 0;
        const t = data.pagination?.total ?? 0;
        setTotalPages(tp);
        setTotal(t);
      } catch (e) {
        if (e?.name === "AbortError" || ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load products");
        if (page === 1) setRows([]);
      } finally {
        if (!cancelled && !ac.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [page, category, search, sort, minPrice, maxPrice, stock, brandSlugs, stockApi]);

  const hasMore = page < totalPages && totalPages > 0;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || loadingMore || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting;
        if (hit) setPage((p) => p + 1);
      },
      { root: null, rootMargin: "280px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, loadingMore, hasMore, rows.length]);

  if (error && page === 1 && !loading) {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-10 text-center">
        <p className="font-ui-medium text-[color:var(--ink)]">{error}</p>
        <p className="mt-2 text-sm text-[color:color-mix(in_srgb,var(--ink)_60%,transparent)]">
          Check that the API is running and try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
        {loading && page === 1 ? "Loading…" : `${total} ${total === 1 ? "product" : "products"}`}
      </p>

      {rows.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-6 py-16 text-center">
          <p className="font-ui-medium text-lg text-[color:var(--ink)]">No matches</p>
          <p className="mt-2 text-sm text-[color:color-mix(in_srgb,var(--ink)_65%,transparent)]">
            Try clearing filters or broadening your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-8 w-full shrink-0" aria-hidden />

      {loadingMore ? (
        <p className="mt-4 text-center text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
          Loading more…
        </p>
      ) : null}
    </>
  );
}

export default function ShopPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categoryRows, setCategoryRows] = useState(FALLBACK_CATEGORY_ROWS);
  const [facets, setFacets] = useState({
    baseTotal: 0,
    inStock: 0,
    outOfStock: 0,
    brands: [],
    priceRange: { minCents: 0, maxCents: 0 },
  });
  const [facetsError, setFacetsError] = useState(null);

  const urlQ = params.get("q") ?? "";
  const deferredQ = useDeferredValue(urlQ);
  const [searchDraft, setSearchDraft] = useState(urlQ);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchWrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((rows) => {
        if (cancelled || !rows.length) return;
        setCategoryRows(rows.map((r) => ({ slug: r.slug, title: r.title })));
      })
      .catch(() => {
        if (!cancelled) setCategoryRows(FALLBACK_CATEGORY_ROWS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSearchDraft(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (searchDraft === urlQ) return;
      const next = new URLSearchParams(params);
      if (searchDraft.trim()) next.set("q", searchDraft.trim());
      else next.delete("q");
      setParams(next, { replace: true });
    }, 320);
    return () => clearTimeout(id);
  }, [searchDraft, urlQ, params, setParams]);

  useEffect(() => {
    if (searchDraft.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ac = new AbortController();
    const id = setTimeout(() => {
      fetchSearchSuggestions(searchDraft, ac.signal)
        .then((data) => {
          if (!ac.signal.aborted) setSuggestions(data.suggestions ?? []);
        })
        .catch(() => {
          if (!ac.signal.aborted) setSuggestions([]);
        });
    }, 200);
    return () => {
      clearTimeout(id);
      ac.abort();
    };
  }, [searchDraft]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!searchWrapRef.current?.contains(e.target)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const category = params.get("category") || "all";
  const minPrice = params.get("min") || "";
  const maxPrice = params.get("max") || "";
  const sort = params.get("sort") || "featured";
  const stockParam = params.get("stock");
  const selectedBrands = params.getAll("brand").filter(Boolean);
  const brandKey = [...selectedBrands].sort().join("\u0001");

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        category,
        q: deferredQ,
        sort,
        min: minPrice,
        max: maxPrice,
        stock: stockParam ?? "",
        brands: brandKey,
      }),
    [category, deferredQ, sort, minPrice, maxPrice, stockParam, brandKey],
  );

  useEffect(() => {
    const ac = new AbortController();
    const stockForFacet = stockParam === "in" ? "in" : stockParam === "out" ? "out" : undefined;
    fetchShopFacets(
      {
        category,
        search: deferredQ,
        min: minPrice,
        max: maxPrice,
        stock: stockForFacet,
      },
      ac.signal,
    )
      .then((data) => {
        if (ac.signal.aborted) return;
        setFacets({
          baseTotal: data.baseTotal ?? 0,
          inStock: data.inStock ?? 0,
          outOfStock: data.outOfStock ?? 0,
          brands: Array.isArray(data.brands) ? data.brands : [],
          priceRange: data.priceRange ?? { minCents: 0, maxCents: 0 },
        });
        setFacetsError(null);
      })
      .catch((e) => {
        if (e?.name === "AbortError" || ac.signal.aborted) return;
        setFacetsError(e instanceof Error ? e.message : "Filters unavailable");
      });
    return () => ac.abort();
  }, [category, deferredQ, minPrice, maxPrice, stockParam]);

  const setField = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params);
      if (value === "" || value == null || value === "all") next.delete(key);
      else next.set(key, value);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const toggleBrand = useCallback(
    (slug) => {
      const next = new URLSearchParams(params);
      const list = next.getAll("brand");
      const idx = list.indexOf(slug);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(slug);
      next.delete("brand");
      list.forEach((b) => next.append("brand", b));
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const applySuggestion = useCallback(
    (s) => {
      setSuggestOpen(false);
      if (s.type === "product") {
        navigate(`/shop/product/${encodeURIComponent(s.slug)}`);
        return;
      }
      const next = new URLSearchParams(params);
      next.delete("q");
      setSearchDraft("");
      if (!next.getAll("brand").includes(s.slug)) next.append("brand", s.slug);
      setParams(next, { replace: true });
    },
    [navigate, params, setParams],
  );

  const filterForm = (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
          Category
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => setField("category", "all")}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                category === "all"
                  ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                  : "text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
              }`}
            >
              All hardware
            </button>
          </li>
          {categoryRows.map(({ slug, title }) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => setField("category", slug)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  category === slug
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                    : "text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                }`}
              >
                {title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
          Availability
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => setField("stock", "all")}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                !stockParam
                  ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                  : "text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
              }`}
            >
              <span>All</span>
              <span
                className={
                  !stockParam
                    ? "tabular-nums text-[color:color-mix(in_srgb,var(--paper)_72%,transparent)]"
                    : "tabular-nums text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]"
                }
              >
                ({facets.baseTotal})
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setField("stock", stockParam === "in" ? "all" : "in")}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                stockParam === "in"
                  ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                  : "text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
              }`}
            >
              <span>In stock</span>
              <span
                className={
                  stockParam === "in"
                    ? "tabular-nums text-[color:color-mix(in_srgb,var(--paper)_72%,transparent)]"
                    : "tabular-nums text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]"
                }
              >
                ({facets.inStock})
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setField("stock", stockParam === "out" ? "all" : "out")}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                stockParam === "out"
                  ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                  : "text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
              }`}
            >
              <span>Out of stock</span>
              <span
                className={
                  stockParam === "out"
                    ? "tabular-nums text-[color:color-mix(in_srgb,var(--paper)_72%,transparent)]"
                    : "tabular-nums text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]"
                }
              >
                ({facets.outOfStock})
              </span>
            </button>
          </li>
        </ul>
      </div>

      {facets.brands.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
            Brand
          </p>
          <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
            {facets.brands.map(({ name, slug, count }) => {
              const active = selectedBrands.includes(slug);
              return (
                <li key={slug}>
                  <button
                    type="button"
                    onClick={() => toggleBrand(slug)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                        : "text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                    }`}
                  >
                    <span>{name}</span>
                    <span
                      className={
                        active
                          ? "tabular-nums text-[color:color-mix(in_srgb,var(--paper)_72%,transparent)]"
                          : "tabular-nums text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]"
                      }
                    >
                      ({count})
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
          Price (USD)
        </p>
        {facets.priceRange.maxCents > 0 ? (
          <p className="mb-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
            In this filter: ${(facets.priceRange.minCents / 100).toFixed(0)} – $
            {(facets.priceRange.maxCents / 100).toFixed(0)}
          </p>
        ) : null}
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Minimum price</span>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setField("min", e.target.value)}
              className="w-full rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3 py-2 text-sm text-[color:var(--ink)] placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]"
            />
          </label>
          <label className="flex-1">
            <span className="sr-only">Maximum price</span>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setField("max", e.target.value)}
              className="w-full rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3 py-2 text-sm text-[color:var(--ink)] placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]"
            />
          </label>
        </div>
      </div>

      {facetsError ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">{facetsError}</p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setParams({}, { replace: true });
          setSearchDraft("");
          setMobileFiltersOpen(false);
        }}
        className="rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_20%,transparent)] py-2 text-sm font-medium text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
      >
        Reset filters
      </button>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,1600px)] flex-col px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:flex-row md:px-6 lg:gap-10 lg:px-8">
      <aside className="mb-6 hidden w-56 shrink-0 md:block lg:w-64">
        <h2 className="mb-4 font-ui-medium text-lg text-[color:var(--ink)]">Filters</h2>
        {filterForm}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-5 font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">
              Shop
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
              Browse PC parts from our catalog. Filters, search suggestions, and sorting are powered by the API.
            </p>
          </div>
          <Link
            to="/categories"
            className="shrink-0 text-sm font-semibold text-[color:color-mix(in_srgb,var(--ink)_70%,transparent)] underline-offset-2 hover:text-[color:var(--ink)] hover:underline"
          >
            View category overview →
          </Link>
        </header>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
            <div ref={searchWrapRef} className="relative min-w-0 flex-1">
              <label className="block">
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  placeholder="Search products, brands…"
                  value={searchDraft}
                  onChange={(e) => {
                    setSearchDraft(e.target.value);
                    setSuggestOpen(true);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSuggestOpen(false);
                  }}
                  autoComplete="off"
                  className="w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-2.5 text-sm text-[color:var(--ink)] placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]"
                />
              </label>
              {suggestOpen && suggestions.length > 0 ? (
                <ul
                  className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-72 overflow-y-auto rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:var(--muted)] py-1 shadow-lg dark:bg-[color:var(--card)]"
                  role="listbox"
                >
                  {suggestions.map((s, i) => (
                    <li key={`${s.type}-${s.slug}-${i}`}>
                      <button
                        type="button"
                        role="option"
                        className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left text-sm text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applySuggestion(s)}
                      >
                        <span className="font-medium">{s.label}</span>
                        <span className="text-xs text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">
                          {s.type === "brand" ? "Brand filter" : s.hint ? `Product · ${s.hint}` : "Product"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)] md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
            </button>
          </div>

          <label className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => setField("sort", e.target.value)}
              className="rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3 py-2 text-sm font-medium text-[color:var(--ink)]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ShopProductResults
          key={filterKey}
          category={category}
          search={deferredQ}
          sort={sort}
          minPrice={minPrice}
          maxPrice={maxPrice}
          stock={stockParam}
          brandSlugs={selectedBrands}
        />
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:var(--muted)] p-5 shadow-2xl dark:bg-[color:var(--card)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-2 text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterForm}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full rounded-xl bg-[color:var(--ink)] py-3 text-sm font-semibold text-[color:var(--paper)]"
            >
              Show results
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
