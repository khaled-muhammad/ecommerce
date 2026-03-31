import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, ClipboardList, ImageIcon, Loader2, Package, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { formatUsd } from "../lib/money.js";
import {
  formPartsToSpecs,
  getCategorySpecBlueprint,
  specsToFormParts,
} from "../lib/categorySpecFields.js";

const API = "/api/v1/admin/catalog";

const STEPS = [
  { id: "details", label: "Basics", hint: "Identity & pricing", Icon: Package },
  { id: "specs", label: "Specs", hint: "Technical details", Icon: ClipboardList },
  { id: "photos", label: "Media", hint: "Images & gallery", Icon: ImageIcon },
  { id: "preview", label: "Review", hint: "How shoppers see it", Icon: Sparkles },
];

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function dollarsToCents(s) {
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function newRowId() {
  return `r-${Math.random().toString(36).slice(2, 11)}`;
}

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

/** Inherits --paper / --ink from .site-root-vars on parent */
function LiveImagePreview({ url, variant = "hero" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [url]);
  const trimmed = (url ?? "").trim();
  if (!trimmed || failed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_16%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] text-[color:color-mix(in_srgb,var(--ink)_38%,transparent)]",
          variant === "hero" ? "aspect-[5/3] w-full text-sm" : "h-16 w-16 shrink-0 text-[10px] leading-snug",
        )}
      >
        <ImageIcon className={variant === "hero" ? "h-8 w-8 opacity-40" : "h-5 w-5 opacity-40"} strokeWidth={1.5} />
        {variant === "hero" ? <span>{trimmed && failed ? "Could not load image" : "Paste a URL to preview"}</span> : null}
      </div>
    );
  }
  return (
    <img
      src={trimmed}
      alt=""
      className={cn(
        "rounded-2xl object-cover shadow-inner ring-1 ring-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]",
        variant === "hero" ? "aspect-[5/3] w-full bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]" : "h-16 w-16 shrink-0",
      )}
      onError={() => setFailed(true)}
    />
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_88%,var(--ink)_2%)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-none">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold tracking-tight text-[color:var(--ink)]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <span className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-[color:var(--ink)]">
      {children}
      {optional ? <span className="text-xs font-normal text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">(optional)</span> : null}
    </span>
  );
}

const inputBase =
  "w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:var(--paper)] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--ink)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-[color:color-mix(in_srgb,var(--ink)_38%,transparent)] focus:border-[color:color-mix(in_srgb,var(--ink)_32%,transparent)] focus:ring-[3px] focus:ring-[color:color-mix(in_srgb,var(--ink)_12%,transparent)]";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string | null} props.editProductId
 * @param {Array<{ id: string; slug: string; title: string }>} props.categories
 * @param {Array<{ id: string; name: string }>} props.brandList
 * @param {(path: string, init?: RequestInit) => Promise<Response>} props.authorizedFetch
 * @param {() => void} props.onSaved
 */
export default function AdminProductModal({
  open,
  onOpenChange,
  editProductId,
  categories,
  brandList,
  authorizedFetch,
  onSaved,
}) {
  const [tab, setTab] = useState("details");
  const [loadError, setLoadError] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [saving, setSaving] = useState(false);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("0");
  const [image, setImage] = useState("");
  const [galleryUrls, setGalleryUrls] = useState([""]);
  const [badge, setBadge] = useState("");
  const [featuredRank, setFeaturedRank] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [schemaValues, setSchemaValues] = useState({});
  const [customRows, setCustomRows] = useState([]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categorySlug = selectedCategory?.slug ?? "";
  const blueprint = getCategorySpecBlueprint(categorySlug);

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.id === tab), [tab]);
  const currentStep = STEPS[stepIndex] ?? STEPS[0];

  const goStep = (delta) => {
    const next = Math.min(Math.max(0, stepIndex + delta), STEPS.length - 1);
    setTab(STEPS[next].id);
  };

  const resetToCreate = useCallback(() => {
    const first = categories[0];
    const slugCat = first?.slug ?? "";
    const parts = specsToFormParts({}, slugCat);
    setTab("details");
    setLoadError(false);
    setSlug("");
    setName("");
    setCategoryId(first?.id ?? "");
    setBrandId("");
    setPrice("");
    setCompareAt("");
    setShortDescription("");
    setDescription("");
    setStock("0");
    setImage("");
    setGalleryUrls([""]);
    setBadge("");
    setFeaturedRank("");
    setIsActive(true);
    setSchemaValues(parts.schemaValues);
    setCustomRows(parts.customRows);
  }, [categories]);

  const applyCategoryChange = useCallback(
    (newCategoryId) => {
      const oldCat = categories.find((c) => c.id === categoryId);
      const newCat = categories.find((c) => c.id === newCategoryId);
      const oldSlug = oldCat?.slug ?? "";
      const newSlug = newCat?.slug ?? "";
      const merged = formPartsToSpecs(schemaValues, customRows, oldSlug) ?? {};
      const next = specsToFormParts(merged, newSlug);
      setSchemaValues(next.schemaValues);
      setCustomRows(next.customRows);
      setCategoryId(newCategoryId);
    },
    [categories, categoryId, schemaValues, customRows],
  );

  const loadProduct = useCallback(
    async (id) => {
      setLoadingProduct(true);
      setLoadError(false);
      try {
        const res = await authorizedFetch(`${API}/products/${id}`);
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.message ?? "Could not load product");
        const p = data.product;
        const parts = specsToFormParts(
          p.specs && typeof p.specs === "object" ? p.specs : {},
          p.categorySlug ?? categories.find((c) => c.id === p.categoryId)?.slug,
        );
        setSlug(p.slug);
        setName(p.name);
        setCategoryId(p.categoryId);
        setBrandId(p.brandId ?? "");
        setPrice((p.priceCents / 100).toFixed(2));
        setCompareAt(p.compareAtCents != null ? (p.compareAtCents / 100).toFixed(2) : "");
        setShortDescription(p.shortDescription ?? "");
        setDescription(p.description ?? "");
        setStock(String(p.stock ?? 0));
        setImage(p.image ?? "");
        const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
        setGalleryUrls(imgs.length ? imgs : [""]);
        setBadge(p.badge ?? "");
        setFeaturedRank(p.featuredRank != null ? String(p.featuredRank) : "");
        setIsActive(Boolean(p.isActive));
        setSchemaValues(parts.schemaValues);
        setCustomRows(parts.customRows);
        setTab("details");
      } catch (e) {
        setLoadError(true);
        toast.error(e instanceof Error ? e.message : "Could not load product");
      } finally {
        setLoadingProduct(false);
      }
    },
    [authorizedFetch, categories],
  );

  useEffect(() => {
    if (!open) return;
    setTab("details");
    if (editProductId) void loadProduct(editProductId);
    else resetToCreate();
  }, [open, editProductId, loadProduct, resetToCreate]);

  const setSchemaField = (key, value) => {
    setSchemaValues((prev) => ({ ...prev, [key]: value }));
  };

  const addCustomRow = () => {
    setCustomRows((rows) => [...rows, { id: newRowId(), label: "", value: "" }]);
  };

  const updateCustomRow = (id, patch) => {
    setCustomRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeCustomRow = (id) => {
    setCustomRows((rows) => rows.filter((r) => r.id !== id));
  };

  const addGalleryRow = () => setGalleryUrls((g) => [...g, ""]);
  const setGalleryAt = (i, v) => setGalleryUrls((g) => g.map((x, j) => (j === i ? v : x)));
  const removeGalleryAt = (i) => setGalleryUrls((g) => (g.length <= 1 ? [""] : g.filter((_, j) => j !== i)));

  const buildSpecsPayload = () => formPartsToSpecs(schemaValues, customRows, categorySlug);

  const handleSave = async () => {
    const priceCents = dollarsToCents(price);
    if (priceCents == null) {
      toast.error("Enter a valid price");
      setTab("details");
      return;
    }
    if (!categoryId) {
      toast.error("Choose a category");
      setTab("details");
      return;
    }
    if (!slug.trim() || !name.trim()) {
      toast.error("Slug and name are required");
      setTab("details");
      return;
    }
    const compareRaw = compareAt.trim() ? dollarsToCents(compareAt) : null;
    let featuredRankNum = null;
    if (featuredRank.trim() !== "") {
      const n = Math.round(Number(featuredRank));
      if (Number.isFinite(n)) featuredRankNum = n;
    }
    const images = galleryUrls.map((s) => s.trim()).filter(Boolean);
    const body = {
      slug: slug.trim(),
      name: name.trim(),
      categoryId,
      brandId: brandId || null,
      priceCents,
      compareAtCents: compareRaw,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      specs: buildSpecsPayload(),
      stock: Math.max(0, Math.round(Number(stock) || 0)),
      image: image.trim() || null,
      images,
      badge: badge.trim() || null,
      featuredRank: featuredRankNum,
      isActive,
    };

    setSaving(true);
    try {
      const res = editProductId
        ? await authorizedFetch(`${API}/products/${editProductId}`, { method: "PATCH", body: JSON.stringify(body) })
        : await authorizedFetch(`${API}/products`, { method: "POST", body: JSON.stringify(body) });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Save failed");
      toast.success(editProductId ? "Product updated" : "Product created");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const brandName = brandList.find((b) => b.id === brandId)?.name ?? "";
  const previewSpecs = buildSpecsPayload();

  const footerPrimary =
    "inline-flex min-h-11 min-w-[8.5rem] items-center justify-center gap-2 rounded-full bg-[color:var(--ink)] px-6 text-sm font-semibold text-[color:var(--paper)] shadow-[0_8px_24px_rgba(14,34,14,0.22)] transition-[transform,opacity,box-shadow] hover:shadow-[0_10px_28px_rgba(14,34,14,0.28)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

  const footerSecondary =
    "inline-flex min-h-11 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_70%,transparent)] px-5 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]";

  const stepNavBtn = (active) =>
    cn(
      "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200",
      active
        ? "bg-[color:var(--paper)] shadow-[0_4px_24px_rgba(14,34,14,0.08)] ring-1 ring-[color:color-mix(in_srgb,var(--ink)_12%,transparent)]"
        : "hover:bg-[color:color-mix(in_srgb,var(--paper)_55%,transparent)]",
    );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[220] bg-[color:color-mix(in_srgb,#0a1a0a_52%,transparent)] backdrop-blur-md" />
        <Dialog.Content
          className={cn(
            "site-root-vars data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[99] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[99] fixed left-1/2 top-1/2 z-[221] flex max-h-[min(92dvh,900px)] w-[min(calc(100vw-1rem),1040px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_96%,var(--ink)_2%)] shadow-[0_32px_90px_rgba(14,34,14,0.2),0_0_0_1px_rgba(255,255,255,0.5)_inset] outline-none duration-200 md:flex-row",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">{editProductId ? "Edit product" : "Create product"}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Guided editor: basics, specifications, images, then review before saving.
          </Dialog.Description>

          {/* Mobile: compact step selector */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] p-2 md:hidden">
            {STEPS.map((s, i) => {
              const active = s.id === tab;
              const Icon = s.Icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                    active ? "bg-[color:var(--paper)] text-[color:var(--ink)] shadow-sm" : "text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]",
                  )}
                  onClick={() => setTab(s.id)}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      active ? "bg-[color:var(--ink)] text-[color:var(--paper)]" : "bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="max-w-[5.5rem] leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden w-[238px] shrink-0 flex-col border-b border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] p-4 md:flex md:border-b-0 md:border-r">
            <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">
              Steps
            </p>
            <p className="mb-4 px-1 text-xs leading-snug text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
              {editProductId ? "Update this listing" : "Add something new to the catalog"}
            </p>
            <nav className="flex flex-col gap-1.5" aria-label="Editor steps">
              {STEPS.map((s, i) => {
                const active = s.id === tab;
                const Icon = s.Icon;
                return (
                  <button key={s.id} type="button" className={stepNavBtn(active)} onClick={() => setTab(s.id)}>
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                        active
                          ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                          : "bg-[color:color-mix(in_srgb,var(--paper)_80%,var(--ink)_6%)] text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]",
                      )}
                    >
                      {active ? <Icon className="h-4 w-4" strokeWidth={2} /> : i + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-sm font-semibold text-[color:var(--ink)]">{s.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">{s.hint}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[color:var(--paper)]">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] px-5 py-4 sm:px-8 sm:py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-[1.35rem]">
                    {editProductId ? "Edit product" : "New product"}
                  </h2>
                  <span className="rounded-full bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">
                    Step {stepIndex + 1} / {STEPS.length}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">{currentStep.hint}</p>
              </div>
              <Dialog.Close
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-[color:var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:color-mix(in_srgb,var(--ink)_25%,transparent)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </Dialog.Close>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8 [scrollbar-gutter:stable]">
              {loadingProduct ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 className="h-9 w-9 animate-spin text-[color:color-mix(in_srgb,var(--ink)_35%,transparent)]" strokeWidth={2} />
                  <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">Loading product…</p>
                </div>
              ) : loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center dark:border-red-900/40 dark:bg-red-950/30">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Could not load this product.</p>
                  <p className="mt-2 text-xs text-red-600/90 dark:text-red-300/80">Close and try again, or pick another item.</p>
                </div>
              ) : (
                <div className="mx-auto flex max-w-3xl flex-col gap-6">
                  {tab === "details" && (
                    <>
                      <SectionCard title="Listing" subtitle="How this product appears in URLs and category browse.">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <FieldLabel>Product name</FieldLabel>
                            <input className={inputBase} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Corsair RM1000x" />
                          </div>
                          <div>
                            <FieldLabel>URL slug</FieldLabel>
                            <input
                              className={cn(inputBase, "font-mono text-sm")}
                              value={slug}
                              onChange={(e) => setSlug(e.target.value)}
                              placeholder="corsair-rm1000x"
                            />
                            <p className="mt-1.5 text-xs text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">Lowercase, hyphens only. Used in /shop/product/…</p>
                          </div>
                          <div>
                            <FieldLabel>Category</FieldLabel>
                            <select className={cn(inputBase, "cursor-pointer")} value={categoryId} onChange={(e) => applyCategoryChange(e.target.value)}>
                              <option value="">Choose category…</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <FieldLabel optional>Brand</FieldLabel>
                            <select className={cn(inputBase, "cursor-pointer")} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                              <option value="">No brand</option>
                              {brandList.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </SectionCard>

                      <SectionCard title="Pricing & stock" subtitle="Shown on the product page and used at checkout.">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <FieldLabel>Price (USD)</FieldLabel>
                            <input className={inputBase} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                          </div>
                          <div>
                            <FieldLabel optional>Compare-at</FieldLabel>
                            <input className={inputBase} inputMode="decimal" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Was price" />
                          </div>
                          <div>
                            <FieldLabel>Stock units</FieldLabel>
                            <input className={inputBase} type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
                          </div>
                        </div>
                      </SectionCard>

                      <SectionCard title="Descriptions" subtitle="Short text for cards; long text for the full product story.">
                        <div className="space-y-4">
                          <div>
                            <FieldLabel optional>Short description</FieldLabel>
                            <textarea className={cn(inputBase, "min-h-[72px] resize-y")} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
                          </div>
                          <div>
                            <FieldLabel>Full description</FieldLabel>
                            <textarea className={cn(inputBase, "min-h-[140px] resize-y")} value={description} onChange={(e) => setDescription(e.target.value)} />
                          </div>
                        </div>
                      </SectionCard>

                      <SectionCard title="Merchandising" subtitle="Optional badges and visibility.">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <FieldLabel optional>Badge</FieldLabel>
                            <input className={inputBase} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="New, Sale, Best seller…" />
                          </div>
                          <div>
                            <FieldLabel optional>Featured rank</FieldLabel>
                            <input className={inputBase} value={featuredRank} onChange={(e) => setFeaturedRank(e.target.value)} placeholder="Higher = more prominent" />
                          </div>
                        </div>
                        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_92%,var(--ink)_2%)] px-4 py-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:color-mix(in_srgb,var(--ink)_15%,transparent)]">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4 rounded border-[color:color-mix(in_srgb,var(--ink)_22%,transparent)] text-[color:var(--ink)]"
                          />
                          <span>
                            <span className="block text-sm font-medium text-[color:var(--ink)]">Visible on storefront</span>
                            <span className="block text-xs text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">Turn off to hide without deleting.</span>
                          </span>
                        </label>
                      </SectionCard>
                    </>
                  )}

                  {tab === "specs" && (
                    <>
                      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] px-5 py-4">
                        <p className="text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                          {blueprint.fields.length > 0 ? (
                            <>
                              Fields below match <strong className="font-semibold text-[color:var(--ink)]">{selectedCategory?.title ?? "this category"}</strong>. Skip anything that does not apply - only filled rows are saved.
                            </>
                          ) : (
                            <>
                              This category has no preset template. Add lines in <strong className="font-semibold text-[color:var(--ink)]">Extra specs</strong> only.
                            </>
                          )}
                        </p>
                      </div>

                      {blueprint.fields.length > 0 ? (
                        <SectionCard title="Category specs" subtitle={`Suggested for ${blueprint.title}.`}>
                          <div className="divide-y divide-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] overflow-hidden">
                            {blueprint.fields.map((f) => (
                              <div key={f.key} className="grid gap-3 bg-[color:var(--paper)] p-4 sm:grid-cols-[minmax(8rem,34%)_1fr] sm:items-center sm:gap-4">
                                <label className="text-sm font-medium text-[color:var(--ink)]">{f.label}</label>
                                <input
                                  className={inputBase}
                                  value={schemaValues[f.key] ?? ""}
                                  onChange={(e) => setSchemaField(f.key, e.target.value)}
                                  placeholder={f.placeholder ?? "-"}
                                />
                              </div>
                            ))}
                          </div>
                        </SectionCard>
                      ) : null}

                      <SectionCard title="Extra specs" subtitle="Any other label / value pairs (warranty, color, region, …).">
                        <div className="space-y-3">
                          {customRows.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_16%,transparent)] py-8 text-center text-sm text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">
                              No extra lines yet. Add one if you need more attributes.
                            </p>
                          ) : (
                            customRows.map((row) => (
                              <div
                                key={row.id}
                                className="flex flex-col gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_94%,var(--ink)_2%)] p-4 sm:flex-row sm:items-center"
                              >
                                <input
                                  className={cn(inputBase, "sm:max-w-[200px]")}
                                  value={row.label}
                                  onChange={(e) => updateCustomRow(row.id, { label: e.target.value })}
                                  placeholder="Label"
                                />
                                <input
                                  className={cn(inputBase, "min-w-0 flex-1")}
                                  value={row.value}
                                  onChange={(e) => updateCustomRow(row.id, { value: e.target.value })}
                                  placeholder="Value"
                                />
                                <button
                                  type="button"
                                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 sm:self-center dark:hover:border-red-800 dark:hover:bg-red-950/40"
                                  aria-label="Remove row"
                                  onClick={() => removeCustomRow(row.id)}
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                                </button>
                              </div>
                            ))
                          )}
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] py-3 text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)] transition-colors hover:border-[color:color-mix(in_srgb,var(--ink)_28%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] hover:text-[color:var(--ink)]"
                            onClick={addCustomRow}
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            Add specification row
                          </button>
                        </div>
                      </SectionCard>
                    </>
                  )}

                  {tab === "photos" && (
                    <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
                      <div className="lg:sticky lg:top-0">
                        <SectionCard title="Hero preview" subtitle="Main image on listings and at the top of the product page.">
                          <label className="block">
                            <FieldLabel>Primary image URL</FieldLabel>
                            <input className={inputBase} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
                          </label>
                          <div className="mt-5">
                            <LiveImagePreview url={image} variant="hero" />
                          </div>
                        </SectionCard>
                      </div>
                      <SectionCard title="Gallery" subtitle="Extra images; each line is optional. Thumbnails update live.">
                        <div className="space-y-4">
                          {galleryUrls.map((u, i) => (
                            <div key={i} className="flex gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_96%,var(--ink)_1%)] p-3">
                              <LiveImagePreview url={u} variant="thumb" />
                              <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <input className={inputBase} value={u} onChange={(e) => setGalleryAt(i, e.target.value)} placeholder="Image URL" />
                              </div>
                              <button
                                type="button"
                                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg border border-transparent text-[color:color-mix(in_srgb,var(--ink)_38%,transparent)] hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900 dark:hover:bg-red-950/50"
                                aria-label="Remove gallery image"
                                onClick={() => removeGalleryAt(i)}
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] py-3 text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] hover:text-[color:var(--ink)]"
                            onClick={addGalleryRow}
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            Add gallery image
                          </button>
                        </div>
                      </SectionCard>
                    </div>
                  )}

                  {tab === "preview" && (
                    <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_90%,var(--ink)_3%)] p-1 shadow-[0_20px_50px_rgba(14,34,14,0.08)]">
                      <div className="overflow-hidden rounded-[1.15rem] bg-[color:var(--paper)] ring-1 ring-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
                        <LiveImagePreview url={image} variant="hero" />
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">
                                {selectedCategory?.title ?? "Category"}
                                {brandName ? ` · ${brandName}` : ""}
                              </p>
                              <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-[color:var(--ink)]">{name || "Product name"}</h3>
                            </div>
                            {badge ? (
                              <span className="rounded-full bg-[color:var(--ink)] px-3 py-1 text-xs font-semibold text-[color:var(--paper)]">{badge}</span>
                            ) : null}
                          </div>
                          <p className="mt-4 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">
                            {shortDescription || "Short description will appear here on cards and under the title."}
                          </p>
                          <div className="mt-5 flex flex-wrap items-baseline gap-3">
                            <span className="text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
                              {dollarsToCents(price) != null ? formatUsd(dollarsToCents(price)) : "-"}
                            </span>
                            {compareAt.trim() && dollarsToCents(compareAt) != null ? (
                              <span className="text-base text-[color:color-mix(in_srgb,var(--ink)_38%,transparent)] line-through">{formatUsd(dollarsToCents(compareAt))}</span>
                            ) : null}
                          </div>
                          {!isActive ? (
                            <p className="mt-4 rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                              Draft: hidden from shoppers until you turn visibility on.
                            </p>
                          ) : null}
                          {previewSpecs && Object.keys(previewSpecs).length > 0 ? (
                            <div className="mt-8 border-t border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] pt-6">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_38%,transparent)]">Specifications</p>
                              <ul className="grid gap-2 sm:grid-cols-2">
                                {Object.entries(previewSpecs).map(([k, v]) => (
                                  <li
                                    key={k}
                                    className="flex flex-col rounded-xl bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] px-4 py-3 ring-1 ring-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
                                  >
                                    <span className="text-xs font-medium text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">{k}</span>
                                    <span className="mt-1 text-sm font-medium text-[color:var(--ink)]">{v}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          <div className="mt-6 border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] pt-6">
                            <p className="whitespace-pre-wrap text-sm leading-[1.65] text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">{description || "Long description…"}</p>
                          </div>
                          {slug.trim() ? (
                            <Link
                              to={`/shop/product/${encodeURIComponent(slug.trim())}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--ink)] underline decoration-[color:color-mix(in_srgb,var(--ink)_22%,transparent)] underline-offset-4 hover:decoration-[color:var(--ink)]"
                            >
                              View on store (new tab)
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_92%,var(--ink)_2%)] px-5 py-4 sm:px-8">
              <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={footerSecondary} disabled={stepIndex <= 0 || loadingProduct || loadError} onClick={() => goStep(-1)}>
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    Back
                  </button>
                  <button
                    type="button"
                    className={footerSecondary}
                    disabled={stepIndex >= STEPS.length - 1 || loadingProduct || loadError}
                    onClick={() => goStep(1)}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <Dialog.Close type="button" className={footerSecondary}>
                    Cancel
                  </Dialog.Close>
                  <button type="button" className={footerPrimary} disabled={saving || loadingProduct || loadError} onClick={() => void handleSave()}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        Saving…
                      </>
                    ) : editProductId ? (
                      "Save changes"
                    ) : (
                      "Publish product"
                    )}
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
