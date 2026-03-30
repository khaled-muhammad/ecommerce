import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../auth/useAuth.js";
import { formatUsd } from "../lib/money.js";
import AdminProductModal from "./AdminProductModal.jsx";

const field =
  "font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] focus:border-[color:color-mix(in_srgb,var(--ink)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ink)_22%,transparent)]";

const btnPrimary =
  "font-ui inline-flex items-center justify-center rounded-xl bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90 disabled:opacity-50";

const btnGhost =
  "font-ui inline-flex items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-transparent px-3 py-2 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]";

const card =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-5";

const API = "/api/v1/admin/catalog";

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function ProductTableRow({ product: p, onEdit, btnGhost }) {
  const [imgBad, setImgBad] = useState(false);
  useEffect(() => {
    setImgBad(false);
  }, [p.image]);
  const url = (p.image ?? "").trim();
  return (
    <tr className="border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
      <td className="px-2 py-2 align-middle">
        {!url || imgBad ? (
          <div
            className="h-11 w-11 rounded-lg bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] ring-1 ring-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
            title="No image"
            aria-hidden
          />
        ) : (
          <img src={url} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]" onError={() => setImgBad(true)} />
        )}
      </td>
      <td className="px-2 py-2 align-middle">
        <span className="font-medium text-[color:var(--ink)]">{p.name}</span>
        <span className="block font-mono text-xs text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">{p.slug}</span>
      </td>
      <td className="px-2 py-2 align-middle text-xs">{p.categoryTitle}</td>
      <td className="px-2 py-2 align-middle">{formatUsd(p.priceCents)}</td>
      <td className="px-2 py-2 align-middle">{p.stock}</td>
      <td className="px-2 py-2 align-middle">{p.isActive ? "Yes" : "No"}</td>
      <td className="px-2 py-2 align-middle">
        <button type="button" className={btnGhost} onClick={onEdit}>
          Edit
        </button>
      </td>
    </tr>
  );
}

export default function AdminCatalogPanel() {
  const { authorizedFetch } = useAuth();
  const [subTab, setSubTab] = useState("categories");

  /* Categories */
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [catEditId, setCatEditId] = useState(null);
  const [catForm, setCatForm] = useState({
    slug: "",
    title: "",
    description: "",
    image: "",
    sortOrder: 0,
    isActive: true,
  });

  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await authorizedFetch(`${API}/categories`);
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Failed to load categories");
      setCategories(data?.categories ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  }, [authorizedFetch]);

  /* Brands */
  const [brandList, setBrandList] = useState([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandEditId, setBrandEditId] = useState(null);
  const [brandForm, setBrandForm] = useState({
    name: "",
    slug: "",
    logo: "",
    website: "",
    isActive: true,
  });

  const loadBrands = useCallback(async () => {
    setBrandLoading(true);
    try {
      const res = await authorizedFetch(`${API}/brands`);
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Failed to load brands");
      setBrandList(data?.brands ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load brands");
    } finally {
      setBrandLoading(false);
    }
  }, [authorizedFetch]);

  /* Products */
  const [prodPage, setProdPage] = useState(1);
  const [prodSearch, setProdSearch] = useState("");
  const [prodActive, setProdActive] = useState("all");
  const [prodList, setProdList] = useState([]);
  const [prodPagination, setProdPagination] = useState(null);
  const [prodLoading, setProdLoading] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalEditId, setProductModalEditId] = useState(null);

  const loadProducts = useCallback(
    async (overridePage) => {
      const page = overridePage ?? prodPage;
      setProdLoading(true);
      try {
        const sp = new URLSearchParams({
          page: String(page),
          limit: "24",
          isActive: prodActive,
        });
        if (prodSearch.trim()) sp.set("search", prodSearch.trim());
        const res = await authorizedFetch(`${API}/products?${sp}`);
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.message ?? "Failed to load products");
        setProdList(data?.products ?? []);
        setProdPagination(data?.pagination ?? null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        setProdLoading(false);
      }
    },
    [authorizedFetch, prodPage, prodSearch, prodActive],
  );

  useEffect(() => {
    if (subTab === "categories") void loadCategories();
  }, [subTab, loadCategories]);

  useEffect(() => {
    if (subTab === "brands") void loadBrands();
  }, [subTab, loadBrands]);

  useEffect(() => {
    if (subTab !== "products") return;
    void loadCategories();
    void loadBrands();
  }, [subTab, loadCategories, loadBrands]);

  useEffect(() => {
    if (subTab !== "products") return;
    void loadProducts();
  }, [subTab, prodPage, prodActive, loadProducts]);

  function resetCatForm() {
    setCatEditId(null);
    setCatForm({ slug: "", title: "", description: "", image: "", sortOrder: 0, isActive: true });
  }

  function startEditCategory(c) {
    setCatEditId(c.id);
    setCatForm({
      slug: c.slug,
      title: c.title,
      description: c.description ?? "",
      image: c.image ?? "",
      sortOrder: c.sortOrder ?? 0,
      isActive: Boolean(c.isActive),
    });
  }

  async function saveCategory(e) {
    e.preventDefault();
    if (catSaving) return;
    setCatSaving(true);
    try {
      const body = {
        slug: catForm.slug.trim(),
        title: catForm.title.trim(),
        description: catForm.description.trim() || null,
        image: catForm.image.trim() || null,
        sortOrder: Number(catForm.sortOrder) || 0,
        isActive: catForm.isActive,
      };
      const res = catEditId
        ? await authorizedFetch(`${API}/categories/${catEditId}`, { method: "PATCH", body: JSON.stringify(body) })
        : await authorizedFetch(`${API}/categories`, { method: "POST", body: JSON.stringify(body) });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Save failed");
      toast.success(catEditId ? "Category updated" : "Category created");
      resetCatForm();
      void loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setCatSaving(false);
    }
  }

  function resetBrandForm() {
    setBrandEditId(null);
    setBrandForm({ name: "", slug: "", logo: "", website: "", isActive: true });
  }

  function startEditBrand(b) {
    setBrandEditId(b.id);
    setBrandForm({
      name: b.name,
      slug: b.slug,
      logo: b.logo ?? "",
      website: b.website ?? "",
      isActive: Boolean(b.isActive),
    });
  }

  async function saveBrand(e) {
    e.preventDefault();
    if (brandSaving) return;
    setBrandSaving(true);
    try {
      const body = {
        name: brandForm.name.trim(),
        slug: brandForm.slug.trim(),
        logo: brandForm.logo.trim() || null,
        website: brandForm.website.trim() || null,
        isActive: brandForm.isActive,
      };
      const res = brandEditId
        ? await authorizedFetch(`${API}/brands/${brandEditId}`, { method: "PATCH", body: JSON.stringify(body) })
        : await authorizedFetch(`${API}/brands`, { method: "POST", body: JSON.stringify(body) });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Save failed");
      toast.success(brandEditId ? "Brand updated" : "Brand created");
      resetBrandForm();
      void loadBrands();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBrandSaving(false);
    }
  }

  function openCreateProduct() {
    setProductModalEditId(null);
    setProductModalOpen(true);
  }

  function openEditProduct(id) {
    setProductModalEditId(id);
    setProductModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
        Manage categories, brands, and products. Slugs must be lowercase with hyphens (e.g. <code className="rounded bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] px-1">gaming-laptops</code>
        ).
      </p>

      <div className="flex flex-wrap gap-2 border-b border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] pb-3">
        {["categories", "brands", "products"].map((id) => (
          <button
            key={id}
            type="button"
            className={[
              "rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors",
              subTab === id
                ? "bg-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] text-[color:var(--ink)]"
                : "text-[color:color-mix(in_srgb,var(--ink)_60%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]",
            ].join(" ")}
            onClick={() => setSubTab(id)}
          >
            {id}
          </button>
        ))}
      </div>

      {subTab === "categories" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h3 className="mb-4 font-ui text-base font-semibold text-[color:var(--ink)]">
              {catEditId ? "Edit category" : "New category"}
            </h3>
            <form className="flex flex-col gap-3" onSubmit={saveCategory}>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Slug
                <input className={`${field} mt-1`} value={catForm.slug} onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))} required />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Title
                <input className={`${field} mt-1`} value={catForm.title} onChange={(e) => setCatForm((f) => ({ ...f, title: e.target.value }))} required />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Description
                <textarea className={`${field} mt-1 min-h-[72px]`} value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Image URL
                <input className={`${field} mt-1`} value={catForm.image} onChange={(e) => setCatForm((f) => ({ ...f, image: e.target.value }))} />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Sort order
                <input
                  className={`${field} mt-1`}
                  type="number"
                  value={catForm.sortOrder}
                  onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]">
                <input
                  type="checkbox"
                  checked={catForm.isActive}
                  onChange={(e) => setCatForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active (visible in storefront)
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={btnPrimary} disabled={catSaving}>
                  {catSaving ? "Saving…" : catEditId ? "Update" : "Create"}
                </button>
                {catEditId ? (
                  <button type="button" className={btnGhost} onClick={resetCatForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </div>
          <div className={card}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-ui text-base font-semibold text-[color:var(--ink)]">All categories</h3>
              <button type="button" className={btnGhost} onClick={() => void loadCategories()} disabled={catLoading}>
                Refresh
              </button>
            </div>
            {catLoading ? (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Loading…</p>
            ) : (
              <ul className="max-h-[420px] space-y-1 overflow-y-auto text-sm">
                {categories.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] px-3 py-2 text-left transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
                      onClick={() => startEditCategory(c)}
                    >
                      <span className="font-medium text-[color:var(--ink)]">{c.title}</span>
                      <span className="font-mono text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">{c.slug}</span>
                      <span className="text-xs text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                        order {c.sortOrder} · {c.isActive ? "active" : "hidden"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {subTab === "brands" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h3 className="mb-4 font-ui text-base font-semibold text-[color:var(--ink)]">{brandEditId ? "Edit brand" : "New brand"}</h3>
            <form className="flex flex-col gap-3" onSubmit={saveBrand}>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Name
                <input className={`${field} mt-1`} value={brandForm.name} onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value }))} required />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Slug
                <input className={`${field} mt-1`} value={brandForm.slug} onChange={(e) => setBrandForm((f) => ({ ...f, slug: e.target.value }))} required />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Logo URL
                <input className={`${field} mt-1`} value={brandForm.logo} onChange={(e) => setBrandForm((f) => ({ ...f, logo: e.target.value }))} />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Website
                <input className={`${field} mt-1`} value={brandForm.website} onChange={(e) => setBrandForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]">
                <input
                  type="checkbox"
                  checked={brandForm.isActive}
                  onChange={(e) => setBrandForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={btnPrimary} disabled={brandSaving}>
                  {brandSaving ? "Saving…" : brandEditId ? "Update" : "Create"}
                </button>
                {brandEditId ? (
                  <button type="button" className={btnGhost} onClick={resetBrandForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </div>
          <div className={card}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-ui text-base font-semibold text-[color:var(--ink)]">All brands</h3>
              <button type="button" className={btnGhost} onClick={() => void loadBrands()} disabled={brandLoading}>
                Refresh
              </button>
            </div>
            {brandLoading ? (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Loading…</p>
            ) : (
              <ul className="max-h-[420px] space-y-1 overflow-y-auto text-sm">
                {brandList.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] px-3 py-2 text-left transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
                      onClick={() => startEditBrand(b)}
                    >
                      <span className="font-medium text-[color:var(--ink)]">{b.name}</span>
                      <span className="font-mono text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">{b.slug}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {subTab === "products" && (
        <div className="space-y-6">
          <AdminProductModal
            open={productModalOpen}
            onOpenChange={(v) => {
              setProductModalOpen(v);
              if (!v) setProductModalEditId(null);
            }}
            editProductId={productModalEditId}
            categories={categories}
            brandList={brandList}
            authorizedFetch={authorizedFetch}
            onSaved={() => void loadProducts()}
          />

          <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
            <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">
              Create or edit products in a guided modal — specs match the category (cases, CPUs, GPUs, …) with live image preview.
            </p>
            <button type="button" className={`${btnPrimary} gap-2`} onClick={openCreateProduct}>
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New product
            </button>
          </div>

          <div className={card}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <h3 className="font-ui text-base font-semibold text-[color:var(--ink)]">Product list</h3>
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setProdPage(1);
                  void loadProducts(1);
                }}
              >
                <label className="text-xs font-semibold uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                  Search
                  <input className={`${field} mt-1 w-40 sm:w-48`} value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} placeholder="Name or slug" />
                </label>
                <label className="text-xs font-semibold uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                  Status
                  <select className={`${field} mt-1`} value={prodActive} onChange={(e) => setProdActive(e.target.value)}>
                    <option value="all">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>
                <button type="submit" className={btnPrimary}>
                  Apply
                </button>
                <button type="button" className={btnGhost} onClick={() => void loadProducts()} disabled={prodLoading}>
                  Refresh
                </button>
              </form>
            </div>
            {prodLoading ? (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Loading…</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-xs uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                      <tr>
                        <th className="px-2 py-2 w-14" aria-label="Image" />
                        <th className="px-2 py-2">Name</th>
                        <th className="px-2 py-2">Category</th>
                        <th className="px-2 py-2">Price</th>
                        <th className="px-2 py-2">Stock</th>
                        <th className="px-2 py-2">Active</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {prodList.map((p) => (
                        <ProductTableRow key={p.id} product={p} onEdit={() => openEditProduct(p.id)} btnGhost={btnGhost} />
                      ))}
                    </tbody>
                  </table>
                </div>
                {prodPagination && prodPagination.totalPages > 1 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                      className={btnGhost}
                      disabled={prodPage <= 1}
                      onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                      Page {prodPagination.page} of {prodPagination.totalPages} ({prodPagination.total} total)
                    </span>
                    <button
                      type="button"
                      className={btnGhost}
                      disabled={prodPage >= prodPagination.totalPages}
                      onClick={() => setProdPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
