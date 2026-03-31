import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Mail, 
  MapPin, 
  CreditCard, 
  Box, 
  ChevronRight, 
  Clock, 
  ClipboardList, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  History, 
  DollarSign,
  ArrowRight
} from "lucide-react";
import { formatUsd } from "../lib/money.js";
import { canManageOrderFulfillment, canRefundOrders } from "../lib/staffCapabilities.js";

const field =
  "font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] focus:border-[color:color-mix(in_srgb,var(--ink)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ink)_22%,transparent)]";

const btnPrimary =
  "font-ui inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--ink)] px-5 py-2.5 text-sm font-semibold text-[color:var(--paper)] transition-all hover:opacity-90 active:scale-95 disabled:opacity-50";

const btnGhost =
  "font-ui inline-flex items-center justify-center gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-transparent px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition-all hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] active:scale-95";

const cardStyle =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6";

const ALL_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

function OrderStatusBadge({ status, className = "" }) {
  const themes = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50",
    shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/50",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200/50",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50",
    refunded: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200/50",
  };

  const theme = themes[status] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200/50";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-tight ${theme} ${className}`}>
      {status}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, sub }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] text-[color:var(--ink)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-[color:var(--ink)]">{title}</h3>
        {sub && <p className="text-[11px] text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">{sub}</p>}
      </div>
    </div>
  );
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return "-";
  }
}

/**
 * @param {{ authorizedFetch: typeof fetch; role: string }} props
 */
export default function AdminOrdersPanel({ authorizedFetch, role }) {
  const canFulfill = canManageOrderFulfillment(role);
  const canRefund = canRefundOrders(role);

  const [listLoading, setListLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [selectedRef, setSelectedRef] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [refundBusy, setRefundBusy] = useState(false);

  const loadList = useCallback(
    async (pageOverride) => {
      const pageNum = typeof pageOverride === "number" ? pageOverride : page;
      setListLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", "25");
        if (statusFilter) params.set("status", statusFilter);
        if (q.trim()) params.set("q", q.trim());
        const res = await authorizedFetch(`/api/v1/staff/orders?${params}`);
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.message ?? "Could not load orders");
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        if (data?.pagination) setPagination(data.pagination);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load orders");
      } finally {
        setListLoading(false);
      }
    },
    [authorizedFetch, page, statusFilter, q],
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(
    async (orderRef) => {
      setSelectedRef(orderRef);
      setDetailLoading(true);
      setDetail(null);
      try {
        const res = await authorizedFetch(`/api/v1/staff/orders/${encodeURIComponent(orderRef)}`);
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.message ?? "Could not load order");
        setDetail(data);
        setDraftStatus(data?.order?.status ?? "");
        setDraftNotes(data?.order?.notes ?? "");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load order");
      } finally {
        setDetailLoading(false);
      }
    },
    [authorizedFetch],
  );

  async function applySearch(e) {
    if (e) e.preventDefault();
    setPage(1);
    await loadList(1);
  }

  async function saveOrder(e) {
    e.preventDefault();
    if (!detail?.order || saveBusy) return;
    const id = detail.order.id;
    const body = {};
    if (canFulfill && draftStatus && draftStatus !== detail.order.status) body.status = draftStatus;
    const notesTrim = draftNotes;
    const prevNotes = detail.order.notes ?? "";
    if (notesTrim !== prevNotes) body.notes = notesTrim;
    if (Object.keys(body).length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaveBusy(true);
    try {
      const res = await authorizedFetch(`/api/v1/staff/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Update failed");
      toast.success("Order updated");
      void loadList();
      void loadDetail(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaveBusy(false);
    }
  }

  async function runRefund() {
    if (!detail?.order || refundBusy) return;
    if (!detail.refundEligible) return;
    const ok = window.confirm(
      `Issue a full Stripe refund for ${detail.order.orderNumber} (${formatUsd(detail.order.totalCents)})? This cannot be undone in this UI.`,
    );
    if (!ok) return;
    setRefundBusy(true);
    try {
      const res = await authorizedFetch(`/api/v1/staff/orders/${encodeURIComponent(detail.order.id)}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Refund failed");
      toast.success("Refund processed");
      void loadList();
      void loadDetail(detail.order.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefundBusy(false);
    }
  }

  const statusOptions = detail?.order
    ? Array.from(new Set([detail.order.status, ...(detail.allowedNextStatuses ?? [])]))
    : [];

  return (
    <div className="flex h-full flex-col gap-6 lg:flex-row">
      {/* Master List Column */}
      <div className={`${cardStyle} flex h-[min(90vh,800px)] w-full flex-col p-0 lg:w-96 xl:w-[420px]`}>
        <div className="border-b border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-ui text-xl font-bold text-[color:var(--ink)]">Orders</h2>
            <button 
              type="button" 
              className="rounded-lg p-2 text-[color:color-mix(in_srgb,var(--ink)_60%,transparent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] hover:text-[color:var(--ink)]"
              onClick={() => void loadList()}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <form className="space-y-3" onSubmit={applySearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:color-mix(in_srgb,var(--ink)_35%,transparent)]" />
              <input
                className={`${field} pl-10`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Order #, email..."
              />
            </div>
            <div className="relative shadow-sm">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:color-mix(in_srgb,var(--ink)_35%,transparent)]" />
              <select 
                className={`${field} pl-10 appearance-none`} 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(() => void loadList(), 0);
                }}
              >
                <option value="">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading && orders.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--ink)] border-t-transparent opacity-40"></div>
              <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">No orders found.</p>
              <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">Try a different search or filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] border-b border-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className={[
                    "relative cursor-pointer px-5 py-4 transition-all duration-200",
                    selectedRef === o.id 
                      ? "bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] active-indicator border-l-4 border-l-[color:var(--ink)]" 
                      : "hover:bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] border-l-4 border-l-transparent",
                  ].join(" ")}
                  onClick={() => void loadDetail(o.id)}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-tight text-[color:var(--ink)]">#{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="mb-2">
                    <p className="truncate text-sm font-medium text-[color:var(--ink)]">{o.fullName || o.email}</p>
                    <p className="truncate text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">{o.email}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-[color:var(--ink)]">{formatUsd(o.totalCents)}</span>
                  </div>
                  {selectedRef === o.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_2%,transparent)] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-medium text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
              {pagination.total} orders · Pg {pagination.page}/{pagination.totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_15%,transparent)] bg-transparent text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] disabled:opacity-30"
                disabled={page <= 1 || listLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_15%,transparent)] bg-transparent text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] disabled:opacity-30"
                disabled={page >= pagination.totalPages || listLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Pane Column */}
      <div className="flex-1 min-w-0">
        {!selectedRef ? (
          <div className={`${cardStyle} flex h-full flex-col items-center justify-center border-dashed p-12 text-center opacity-70`}>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]">
              <ClipboardList className="h-10 w-10 text-[color:color-mix(in_srgb,var(--ink)_30%,transparent)]" />
            </div>
            <h3 className="text-xl font-bold text-[color:var(--ink)]">Select an order</h3>
            <p className="mt-2 max-w-xs text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
              Pick an order from the list on the left to see details, manage fulfillment, or issue refunds.
            </p>
          </div>
        ) : detailLoading ? (
          <div className={`${cardStyle} flex h-full flex-col items-center justify-center p-12`}>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--ink)] border-t-transparent opacity-30"></div>
            <p className="mt-4 text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Fetching order details...</p>
          </div>
        ) : detail?.order ? (
          <div className="flex h-full flex-col gap-6">
            {/* Header Hero */}
            <div className={`${cardStyle} relative overflow-hidden`}>
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)]"></div>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-black uppercase tracking-tighter text-[color:var(--ink)]">#{detail.order.orderNumber}</span>
                    <OrderStatusBadge status={detail.order.status} className="h-fit px-3 py-1 text-sm" />
                  </div>
                  <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Placed {formatDate(detail.order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canRefund && detail.refundEligible && (
                    <button
                      type="button"
                      className="font-ui inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400"
                      onClick={() => void runRefund()}
                      disabled={refundBusy}
                    >
                      <DollarSign className="h-3.5 w-3.5" /> {refundBusy ? "Processing..." : "Refund Order"}
                    </button>
                  )}
                  <button 
                    type="submit" 
                    form="order-actions-form"
                    className={btnPrimary} 
                    disabled={saveBusy}
                  >
                    <CheckCircle2 className="h-4 w-4" /> {saveBusy ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Customer Info Card */}
              <div className={cardStyle}>
                <SectionHeader icon={User} title="Customer Information" />
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-1.5">
                      <Mail className="h-3.5 w-3.5 text-[color:color-mix(in_srgb,var(--ink)_60%,transparent)]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">Email Address</p>
                      <p className="text-sm font-medium text-[color:var(--ink)]">{detail.order.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-1.5">
                      <User className="h-3.5 w-3.5 text-[color:color-mix(in_srgb,var(--ink)_60%,transparent)]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">Full Name</p>
                      <p className="text-sm font-medium text-[color:var(--ink)]">{detail.order.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] pt-4">
                    <div className="mt-0.5 rounded-md bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[color:color-mix(in_srgb,var(--ink)_60%,transparent)]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">Shipping Address</p>
                      <p className="text-sm font-medium leading-relaxed text-[color:var(--ink)]">
                        {detail.order.address1}
                        {detail.order.address2 ? `, ${detail.order.address2}` : ""}
                        <br />
                        {detail.order.city}, {detail.order.postal}
                        <br />
                        {detail.order.country}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status & Notes Card */}
              <div className={cardStyle}>
                <SectionHeader icon={Box} title="Order Management" />
                <form id="order-actions-form" className="mt-4 space-y-4" onSubmit={saveOrder}>
                  {canFulfill ? (
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                        <History className="h-3 w-3" /> Update Status
                      </label>
                      <select className={field} value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">
                        Allowed transitions: <span className="font-mono">{(detail.allowedNextStatuses ?? []).join(", ") || "none"}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
                      <p className="text-xs font-semibold uppercase text-slate-500">Current Status</p>
                      <p className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">{detail.order.status}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                      <ClipboardList className="h-3 w-3" /> Staff Notes
                    </label>
                    <textarea
                      className={`${field} min-h-[100px] resize-none py-3 text-xs`}
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      placeholder="Add private internal notes here..."
                    />
                  </div>
                </form>
              </div>

              {/* Line Items Card */}
              <div className={`${cardStyle} md:col-span-2`}>
                <SectionHeader icon={Truck} title="Order Contents" sub={`${detail.lines?.length || 0} line items`} />
                <div className="mt-2 overflow-x-auto rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] text-[11px] font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-[color:var(--ink)]">
                      {(detail.lines ?? []).map((line) => (
                        <tr key={line.id} className="hover:bg-[color:color-mix(in_srgb,var(--ink)_2%,transparent)] transition-colors">
                          <td className="px-4 py-3 font-medium">{line.productName}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex h-6 w-8 items-center justify-center rounded bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-xs font-bold leading-none">
                              {line.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs opacity-70">
                            {formatUsd(line.lineTotalCents / line.quantity)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">{formatUsd(line.lineTotalCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[color:color-mix(in_srgb,var(--ink)_2%,transparent)] font-bold">
                        <td colSpan="3" className="px-4 py-4 text-right text-sm">Order Total</td>
                        <td className="px-4 py-4 text-right text-base text-[color:var(--ink)] underline decoration-[color:color-mix(in_srgb,var(--ink)_20%,transparent)] underline-offset-4">
                          {formatUsd(detail.order.totalCents)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  {(detail.lines ?? []).length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]">No items found in this order.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info / Alert Card */}
              {canRefund && detail.refundEligible && (
                <div className={`${cardStyle} flex items-start gap-4 border-amber-200 bg-amber-50 md:col-span-2 dark:border-amber-900/30 dark:bg-amber-950/10`}>
                  <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Stripe Refund Available</h4>
                    <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400 opacity-80">
                      This order was paid via Stripe and is eligible for a full refund. Refunding will return the full amount to the customer's original payment method and update the order status.
                    </p>
                    <button 
                      type="button"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline decoration-amber-300 underline-offset-4 hover:text-amber-700 dark:text-amber-200 dark:decoration-amber-800"
                      onClick={() => void runRefund()}
                      disabled={refundBusy}
                    >
                      <DollarSign className="h-3 w-3" /> {refundBusy ? "Processing..." : "Initiate Refund Proceeding"} <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`${cardStyle} flex h-full flex-col items-center justify-center p-12 text-center`}>
            <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">Error loading order. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
