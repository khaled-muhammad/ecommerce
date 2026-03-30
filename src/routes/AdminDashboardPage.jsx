import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "../auth/useAuth.js";
import { formatUsd } from "../lib/money.js";
import {
  canLookupCustomers,
  canManageCatalog,
  canManagePromotions,
  canStaffAdmin,
  canViewAnalytics,
  canViewOrders,
  getAdminTabsForRole,
  hasStaffDashboardAccess,
} from "../lib/staffCapabilities.js";
import AdminCatalogPanel from "./AdminCatalogPanel.jsx";
import AdminOrdersPanel from "./AdminOrdersPanel.jsx";
import StaffRoleOverview from "./StaffRoleOverview.jsx";

const pageTop = "pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]";

const field =
  "font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] focus:border-[color:color-mix(in_srgb,var(--ink)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ink)_22%,transparent)]";

const btnPrimary =
  "font-ui inline-flex items-center justify-center rounded-xl bg-[color:var(--ink)] px-5 py-2.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90 disabled:opacity-50";

const btnGhost =
  "font-ui inline-flex items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-transparent px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]";

const card =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6";

const INVITE_ROLES = [
  "customer",
  "support",
  "fulfillment",
  "content_editor",
  "analyst",
  "manager",
  "admin",
  "owner",
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

function toIsoOrNull(datetimeLocal) {
  if (!datetimeLocal || !String(datetimeLocal).trim()) return null;
  const d = new Date(datetimeLocal);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export default function AdminDashboardPage() {
  const { user, loading, authorizedFetch } = useAuth();
  const tabs = useMemo(() => (user?.role ? getAdminTabsForRole(user.role) : []), [user?.role]);
  const [tabSelected, setTabSelected] = useState(null);
  const activeTab = useMemo(() => {
    if (!tabs.length) return null;
    if (tabSelected && tabs.some((t) => t.id === tabSelected)) return tabSelected;
    return tabs[0].id;
  }, [tabSelected, tabs]);

  /* ── Staff (owner / admin) ── */
  const [catalogRoles, setCatalogRoles] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");
  const [revokeEmail, setRevokeEmail] = useState("");
  const [staffBusy, setStaffBusy] = useState(false);

  const loadCatalogRoles = useCallback(async () => {
    if (!user || !canStaffAdmin(user.role)) return;
    try {
      const res = await authorizedFetch("/api/v1/staff/roles");
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Could not load roles");
      setCatalogRoles(Array.isArray(data?.roles) ? data.roles : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load roles");
    }
  }, [authorizedFetch, user]);

  useEffect(() => {
    if (activeTab === "staff" && user && canStaffAdmin(user.role)) void loadCatalogRoles();
  }, [activeTab, user, loadCatalogRoles]);

  async function submitInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim() || staffBusy) return;
    setStaffBusy(true);
    try {
      const res = await authorizedFetch("/api/v1/staff/invite", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Invite failed");
      toast.success(data?.message ?? "Role updated");
      setInviteEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setStaffBusy(false);
    }
  }

  async function submitRevoke(e) {
    e.preventDefault();
    if (!revokeEmail.trim() || staffBusy) return;
    setStaffBusy(true);
    try {
      const res = await authorizedFetch("/api/v1/staff/revoke", {
        method: "POST",
        body: JSON.stringify({ email: revokeEmail.trim() }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Revoke failed");
      toast.success(data?.message ?? "Revoked");
      setRevokeEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setStaffBusy(false);
    }
  }

  /* ── Customers ── */
  const [custQuery, setCustQuery] = useState("");
  const [custResults, setCustResults] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState(null);
  const [custDetail, setCustDetail] = useState(null);
  const [custDetailLoading, setCustDetailLoading] = useState(false);

  const searchCustomers = useCallback(
    async (q) => {
      if (!user || !canLookupCustomers(user.role)) return;
      setCustLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("email", q.trim());
        const res = await authorizedFetch(`/api/v1/staff/customers?${params}`);
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.message ?? "Search failed");
        setCustResults(data?.users ?? []);
        setSelectedCustId(null);
        setCustDetail(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Search failed");
      } finally {
        setCustLoading(false);
      }
    },
    [authorizedFetch, user],
  );

  const loadCustomerDetail = useCallback(
    async (id) => {
      setCustDetailLoading(true);
      setSelectedCustId(id);
      setCustDetail(null);
      try {
        const res = await authorizedFetch(`/api/v1/staff/customers/${id}`);
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.message ?? "Could not load customer");
        setCustDetail(data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load customer");
      } finally {
        setCustDetailLoading(false);
      }
    },
    [authorizedFetch],
  );

  /* ── Promotions ── */
  const [coupons, setCoupons] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    minOrderCents: 0,
    maxUses: "",
    freeShipping: false,
    startsAt: "",
    expiresAt: "",
    isActive: true,
  });
  const [promoSaving, setPromoSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    if (!user || !canManagePromotions(user.role)) return;
    setPromoLoading(true);
    try {
      const res = await authorizedFetch("/api/v1/promotions/");
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Could not load coupons");
      setCoupons(data?.coupons ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load coupons");
    } finally {
      setPromoLoading(false);
    }
  }, [authorizedFetch, user]);

  useEffect(() => {
    if (activeTab === "promotions" && user && canManagePromotions(user.role)) void loadCoupons();
  }, [activeTab, user, loadCoupons]);

  async function submitCoupon(e) {
    e.preventDefault();
    if (promoSaving) return;
    setPromoSaving(true);
    try {
      const maxUsesRaw = promoForm.maxUses === "" || promoForm.maxUses == null ? null : Number(promoForm.maxUses);
      const body = {
        code: promoForm.code.trim(),
        type: promoForm.type,
        value: Math.round(Number(promoForm.value)),
        minOrderCents: Math.max(0, Math.round(Number(promoForm.minOrderCents) || 0)),
        maxUses: maxUsesRaw != null && maxUsesRaw > 0 ? maxUsesRaw : null,
        freeShipping: Boolean(promoForm.freeShipping),
        startsAt: toIsoOrNull(promoForm.startsAt),
        expiresAt: toIsoOrNull(promoForm.expiresAt),
        isActive: Boolean(promoForm.isActive),
      };
      if (!body.code || body.value < 1) {
        toast.error("Code and a positive value are required");
        return;
      }
      const res = await authorizedFetch("/api/v1/promotions/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Could not create coupon");
      toast.success("Coupon created");
      setPromoForm((p) => ({
        ...p,
        code: "",
        value: p.type === "percentage" ? 10 : 1000,
      }));
      void loadCoupons();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create coupon");
    } finally {
      setPromoSaving(false);
    }
  }

  /* ── Analytics ── */
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [eventBusy, setEventBusy] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!user || !canViewAnalytics(user.role)) return;
    setSummaryLoading(true);
    try {
      const res = await authorizedFetch("/api/v1/analytics/summary");
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Could not load analytics");
      setSummary(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load analytics");
    } finally {
      setSummaryLoading(false);
    }
  }, [authorizedFetch, user]);

  useEffect(() => {
    if (activeTab === "analytics" && user && canViewAnalytics(user.role)) void loadSummary();
  }, [activeTab, user, loadSummary]);

  async function sendTestEvent() {
    setEventBusy(true);
    try {
      const res = await authorizedFetch("/api/v1/analytics/events", {
        method: "POST",
        body: JSON.stringify({ type: "page.view", data: { path: "/admin", source: "dashboard" } }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Event failed");
      toast.success("Event recorded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Event failed");
    } finally {
      setEventBusy(false);
    }
  }

  if (loading) {
    return (
      <div className={`${pageTop} w-full max-w-none px-4 pb-16 font-ui sm:px-6 lg:px-8`}>
        <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!hasStaffDashboardAccess(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`${pageTop} w-full max-w-none px-4 pb-20 font-ui sm:px-6 lg:px-8`}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
            <LayoutDashboard className="h-5 w-5" strokeWidth={2} aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">Staff</span>
          </div>
          <h1 className="font-ui text-2xl font-bold tracking-tight text-[color:var(--ink)]">Staff hub</h1>
          <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
            Signed in as <span className="font-medium text-[color:var(--ink)]">{user.email}</span>
            <span className="mx-1.5">·</span>
            Role <span className="font-medium text-[color:var(--ink)]">{user.role}</span>
          </p>
        </div>
        <Link to="/" className={`${btnGhost} self-start sm:self-auto`}>
          Back to store
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeTab === t.id
                ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                : "text-[color:color-mix(in_srgb,var(--ink)_70%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]",
            ].join(" ")}
            onClick={() => setTabSelected(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "workspace" && <StaffRoleOverview role={user.role} />}

      {activeTab === "catalog" && canManageCatalog(user.role) && <AdminCatalogPanel />}

      {activeTab === "staff" && canStaffAdmin(user.role) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h2 className="mb-1 font-ui text-lg font-semibold text-[color:var(--ink)]">Role catalog</h2>
            <p className="mb-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
              Roles defined in the system (from database seed).
            </p>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {catalogRoles.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] px-3 py-2"
                >
                  <span className="font-medium text-[color:var(--ink)]">{r.name}</span>
                  {r.description ? (
                    <span className="text-right text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">{r.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {catalogRoles.length === 0 ? (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">No roles returned. Run DB seed.</p>
            ) : null}
          </div>

          <div className={card}>
            <h2 className="mb-1 font-ui text-lg font-semibold text-[color:var(--ink)]">Assign role</h2>
            <p className="mb-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
              User must already have registered. Updates their <code className="rounded bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] px-1">users.role</code>.
            </p>
            <form className="flex flex-col gap-3" onSubmit={submitInvite}>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Email
                <input className={field} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                New role
                <select className={field} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {INVITE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={btnPrimary} disabled={staffBusy}>
                {staffBusy ? "Saving…" : "Update role"}
              </button>
            </form>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <h2 className="mb-1 font-ui text-lg font-semibold text-[color:var(--ink)]">Revoke staff access</h2>
            <p className="mb-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Sets the user back to customer.</p>
            <form className="flex flex-col gap-3 sm:max-w-md" onSubmit={submitRevoke}>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Email
                <input className={field} type="email" value={revokeEmail} onChange={(e) => setRevokeEmail(e.target.value)} required />
              </label>
              <button type="submit" className={btnGhost} disabled={staffBusy}>
                Revoke to customer
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "customers" && canLookupCustomers(user.role) && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className={`${card} lg:col-span-2`}>
            <h2 className="mb-4 font-ui text-lg font-semibold text-[color:var(--ink)]">Find customers</h2>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void searchCustomers(custQuery);
              }}
            >
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Email contains
                <input
                  className={field}
                  value={custQuery}
                  onChange={(e) => setCustQuery(e.target.value)}
                  placeholder="e.g. @gmail.com"
                />
              </label>
              <button type="submit" className={btnPrimary} disabled={custLoading}>
                {custLoading ? "Searching…" : "Search"}
              </button>
            </form>
            <p className="mt-3 text-xs text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
              Enter part of an email (e.g. <code className="rounded bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] px-1">@acme</code>) — the API matches active users only.
            </p>
            <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto text-sm">
              {custResults.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className={[
                      "w-full rounded-lg px-3 py-2 text-left transition-colors",
                      selectedCustId === u.id
                        ? "bg-[color:color-mix(in_srgb,var(--ink)_14%,transparent)]"
                        : "hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]",
                    ].join(" ")}
                    onClick={() => void loadCustomerDetail(u.id)}
                  >
                    <span className="block font-medium text-[color:var(--ink)]">{u.email}</span>
                    <span className="text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                      {u.name || "—"} · {u.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${card} lg:col-span-3`}>
            <h2 className="mb-4 font-ui text-lg font-semibold text-[color:var(--ink)]">Customer detail</h2>
            {custDetailLoading ? (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Loading…</p>
            ) : custDetail?.user ? (
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="font-medium text-[color:var(--ink)]">{custDetail.user.email}</p>
                  <p className="text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                    {custDetail.user.name || "No name"} · {custDetail.user.role} · verified: {custDetail.user.emailVerified ? "yes" : "no"}
                  </p>
                  <p className="text-xs text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    Joined {formatDate(custDetail.user.createdAt)}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    Orders (up to 50)
                  </h3>
                  <div className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]">
                    <table className="w-full min-w-[320px] text-left text-sm">
                      <thead className="sticky top-0 bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-xs uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                        <tr>
                          <th className="px-3 py-2">Order</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Total</th>
                          <th className="px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(custDetail.orders ?? []).map((o) => (
                          <tr key={o.id} className="border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
                            <td className="px-3 py-2 font-mono text-xs">{o.orderNumber}</td>
                            <td className="px-3 py-2">{o.status}</td>
                            <td className="px-3 py-2">{formatUsd(o.totalCents)}</td>
                            <td className="px-3 py-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                              {formatDate(o.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(custDetail.orders ?? []).length === 0 ? (
                      <p className="px-3 py-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">No orders</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">Select a customer from the list.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && canViewOrders(user.role) && (
        <AdminOrdersPanel authorizedFetch={authorizedFetch} role={user.role} />
      )}

      {activeTab === "promotions" && canManagePromotions(user.role) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h2 className="mb-4 font-ui text-lg font-semibold text-[color:var(--ink)]">Create coupon</h2>
            <form className="flex flex-col gap-3" onSubmit={submitCoupon}>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Code
                <input className={field} value={promoForm.code} onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value }))} required />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                  Type
                  <select
                    className={field}
                    value={promoForm.type}
                    onChange={(e) => setPromoForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="percentage">Percentage off</option>
                    <option value="fixed">Fixed amount (cents)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                  {promoForm.type === "percentage" ? "Percent (e.g. 15)" : "Cents off"}
                  <input
                    className={field}
                    type="number"
                    min={1}
                    value={promoForm.value}
                    onChange={(e) => setPromoForm((p) => ({ ...p, value: Number(e.target.value) }))}
                    required
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Minimum order (cents)
                <input
                  className={field}
                  type="number"
                  min={0}
                  value={promoForm.minOrderCents}
                  onChange={(e) => setPromoForm((p) => ({ ...p, minOrderCents: Number(e.target.value) }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Max uses (empty = unlimited)
                <input
                  className={field}
                  type="number"
                  min={1}
                  value={promoForm.maxUses}
                  onChange={(e) => setPromoForm((p) => ({ ...p, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]">
                <input
                  type="checkbox"
                  checked={promoForm.freeShipping}
                  onChange={(e) => setPromoForm((p) => ({ ...p, freeShipping: e.target.checked }))}
                  className="rounded border-[color:color-mix(in_srgb,var(--ink)_25%,transparent)]"
                />
                Free shipping
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Starts (optional)
                <input
                  className={field}
                  type="datetime-local"
                  value={promoForm.startsAt}
                  onChange={(e) => setPromoForm((p) => ({ ...p, startsAt: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Expires (optional)
                <input
                  className={field}
                  type="datetime-local"
                  value={promoForm.expiresAt}
                  onChange={(e) => setPromoForm((p) => ({ ...p, expiresAt: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]">
                <input
                  type="checkbox"
                  checked={promoForm.isActive}
                  onChange={(e) => setPromoForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-[color:color-mix(in_srgb,var(--ink)_25%,transparent)]"
                />
                Active
              </label>
              <button type="submit" className={btnPrimary} disabled={promoSaving}>
                {promoSaving ? "Creating…" : "Create coupon"}
              </button>
            </form>
          </div>
          <div className={card}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-ui text-lg font-semibold text-[color:var(--ink)]">Coupons</h2>
              <button type="button" className={btnGhost} onClick={() => void loadCoupons()} disabled={promoLoading}>
                Refresh
              </button>
            </div>
            {promoLoading ? (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Loading…</p>
            ) : (
              <div className="max-h-[480px] overflow-x-auto overflow-y-auto rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="sticky top-0 bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-xs uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    <tr>
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Value</th>
                      <th className="px-2 py-2">Uses</th>
                      <th className="px-2 py-2">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id} className="border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
                        <td className="px-2 py-2 font-mono font-medium">{c.code}</td>
                        <td className="px-2 py-2">{c.type}</td>
                        <td className="px-2 py-2">
                          {c.type === "percentage" ? `${c.value}%` : formatUsd(c.value)}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          {c.usedCount ?? 0}
                          {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                        </td>
                        <td className="px-2 py-2">{c.isActive ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {coupons.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">No coupons yet</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && canViewAnalytics(user.role) && (
        <div className="space-y-6">
          <div className={card}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-ui text-lg font-semibold text-[color:var(--ink)]">Last 30 days (paid orders)</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnGhost} onClick={() => void loadSummary()} disabled={summaryLoading}>
                  Refresh
                </button>
                <button type="button" className={btnGhost} onClick={() => void sendTestEvent()} disabled={eventBusy}>
                  Log test page view
                </button>
              </div>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Loading…</p>
            ) : summary ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    Paid orders
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--ink)]">{summary.paidOrders}</p>
                </div>
                <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    Revenue
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--ink)]">{formatUsd(summary.revenueCents)}</p>
                </div>
              </div>
            ) : null}
          </div>
          {summary?.topProducts?.length ? (
            <div className={card}>
              <h3 className="mb-4 font-ui text-base font-semibold text-[color:var(--ink)]">Top products by revenue</h3>
              <div className="overflow-x-auto rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead className="bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-xs uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Units</th>
                      <th className="px-3 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topProducts.map((p) => (
                      <tr key={p.productId} className="border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
                        <td className="px-3 py-2">{p.productName}</td>
                        <td className="px-3 py-2">{p.units}</td>
                        <td className="px-3 py-2">{formatUsd(p.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
