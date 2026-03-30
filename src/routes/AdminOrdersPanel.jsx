import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { formatUsd } from "../lib/money.js";
import { canManageOrderFulfillment, canRefundOrders } from "../lib/staffCapabilities.js";

const field =
  "font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] focus:border-[color:color-mix(in_srgb,var(--ink)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ink)_22%,transparent)]";

const btnPrimary =
  "font-ui inline-flex items-center justify-center rounded-xl bg-[color:var(--ink)] px-5 py-2.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90 disabled:opacity-50";

const btnGhost =
  "font-ui inline-flex items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-transparent px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]";

const card =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6";

const ALL_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

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
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
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
    e.preventDefault();
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
    <div className="grid gap-6 lg:grid-cols-5">
      <div className={`${card} lg:col-span-2`}>
        <h2 className="mb-4 font-ui text-lg font-semibold text-[color:var(--ink)]">Orders</h2>
        <form className="flex flex-col gap-3" onSubmit={applySearch}>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
            Status
            <select className={field} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
            Search
            <input
              className={field}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order #, email, or name"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btnPrimary} disabled={listLoading}>
              {listLoading ? "Loading…" : "Apply"}
            </button>
            <button type="button" className={btnGhost} onClick={() => void loadList()} disabled={listLoading}>
              Refresh
            </button>
          </div>
        </form>
        <div className="mt-4 max-h-[min(52vh,520px)] overflow-x-auto overflow-y-auto rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]">
          <table className="w-full min-w-[300px] text-left text-sm">
            <thead className="sticky top-0 bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-xs uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
              <tr>
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className={[
                    "cursor-pointer border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]",
                    selectedRef === o.id ? "bg-[color:color-mix(in_srgb,var(--ink)_12%,transparent)]" : "hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]",
                  ].join(" ")}
                  onClick={() => void loadDetail(o.id)}
                >
                  <td className="px-2 py-2 font-mono text-xs">{o.orderNumber}</td>
                  <td className="px-2 py-2 capitalize">{o.status}</td>
                  <td className="px-2 py-2">{formatUsd(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !listLoading ? (
            <p className="px-3 py-6 text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">No orders match.</p>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className={btnGhost}
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className={btnGhost}
              disabled={page >= pagination.totalPages || listLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className={`${card} lg:col-span-3`}>
        <h2 className="mb-4 font-ui text-lg font-semibold text-[color:var(--ink)]">Order detail</h2>
        {detailLoading ? (
          <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Loading…</p>
        ) : detail?.order ? (
          <div className="space-y-5">
            <div className="text-sm">
              <p className="font-mono text-base font-semibold text-[color:var(--ink)]">{detail.order.orderNumber}</p>
              <p className="mt-1 text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                {detail.order.email} · {detail.order.fullName}
              </p>
              <p className="mt-1 text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">
                {detail.order.address1}
                {detail.order.address2 ? `, ${detail.order.address2}` : ""}
                <br />
                {detail.order.city}, {detail.order.postal} · {detail.order.country}
              </p>
              <p className="mt-2 font-medium text-[color:var(--ink)]">{formatUsd(detail.order.totalCents)}</p>
              <p className="text-xs text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">Placed {formatDate(detail.order.createdAt)}</p>
            </div>

            <form className="space-y-4" onSubmit={saveOrder}>
              {canFulfill ? (
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                  Status
                  <select className={field} value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] font-normal normal-case text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">
                    Allowed next: {(detail.allowedNextStatuses ?? []).join(", ") || "—"}
                  </span>
                </label>
              ) : (
                <p className="text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    Status{" "}
                  </span>
                  <span className="capitalize text-[color:var(--ink)]">{detail.order.status}</span>
                </p>
              )}

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Internal notes
                <textarea
                  className={`${field} min-h-[88px] resize-y`}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Visible to staff only"
                />
              </label>
              <p className="text-[11px] text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">
                Anyone on this tab can save notes. Status changes require fulfillment access. Refunds use Stripe below.
              </p>
              <button type="submit" className={btnPrimary} disabled={saveBusy}>
                {saveBusy ? "Saving…" : "Save notes / status"}
              </button>
            </form>

            {canRefund && detail.refundEligible ? (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/25">
                <p className="text-sm font-medium text-[color:var(--ink)]">Refund</p>
                <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
                  Full refund via Stripe (requires STRIPE_SECRET_KEY and a stored payment intent on the order).
                </p>
                <button type="button" className={`${btnGhost} mt-3 border-amber-300 dark:border-amber-800`} onClick={() => void runRefund()} disabled={refundBusy}>
                  {refundBusy ? "Processing…" : "Refund in Stripe"}
                </button>
              </div>
            ) : null}

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                Line items
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]">
                <table className="w-full min-w-[360px] text-left text-sm">
                  <thead className="bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] text-xs uppercase text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.lines ?? []).map((line) => (
                      <tr key={line.id} className="border-t border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]">
                        <td className="px-3 py-2">{line.productName}</td>
                        <td className="px-3 py-2">{line.quantity}</td>
                        <td className="px-3 py-2">{formatUsd(line.lineTotalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(detail.lines ?? []).length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">No lines</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">Select an order from the list.</p>
        )}
      </div>
    </div>
  );
}
