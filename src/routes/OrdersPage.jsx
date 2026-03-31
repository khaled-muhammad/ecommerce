import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "radix-ui";
import { Package } from "lucide-react";
import { toast } from "react-toastify";
import { formatUsd } from "../lib/money.js";
import { useAuth } from "../auth/useAuth.js";

const pageTop = "pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]";

const card =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6";

const statusThemes = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/35 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/35 dark:text-rose-300",
  refunded: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

function StatusBadge({ status }) {
  const c = statusThemes[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${c}`}>{status}</span>
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

export default function OrdersPage() {
  const { authorizedFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit) });
      const res = await authorizedFetch(`/api/v1/profile/orders?${params}`);
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Could not load orders");
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      if (data?.pagination) setPagination((p) => ({ ...p, ...data.pagination }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, pagination.page, pagination.limit]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openDetail = async (orderId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await authorizedFetch(`/api/v1/profile/orders/${encodeURIComponent(orderId)}`);
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Could not load order");
      setDetail(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load order");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className={`mx-auto w-full max-w-[min(100%,960px)] px-4 pb-20 md:px-6 lg:px-8 ${pageTop}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-ui-medium text-3xl tracking-tight text-[color:var(--ink)] md:text-4xl">Your orders</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
            Track status and open an order to see line items. Links go to the product page when the item is still in the catalog.
          </p>
        </div>
        <Link
          to="/shop"
          className="font-ui inline-flex items-center gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] px-4 py-2.5 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
        >
          <Package className="h-4 w-4" strokeWidth={2} aria-hidden />
          Continue shopping
        </Link>
      </div>

      {loading ? (
        <div className={card}>
          <p className="text-center text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className={card}>
          <p className="text-center text-sm font-medium text-[color:var(--ink)]">No orders yet.</p>
          <p className="mt-2 text-center text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
            When you complete checkout, your orders will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => void openDetail(o.id)}
                className="flex w-full flex-col gap-2 rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-4 text-left transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_7%,transparent)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-[color:var(--ink)]">#{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold tabular-nums text-[color:var(--ink)]">{formatUsd(o.totalCents)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            className="rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || loading}
            className="rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </button>
        </div>
      ) : null}

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[220] bg-black/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[221] max-h-[min(90dvh,720px)] w-[min(calc(100vw-1.5rem),480px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:var(--paper)] p-6 shadow-2xl outline-none duration-200">
            <Dialog.Title className="font-ui-medium text-lg text-[color:var(--ink)]">Order details</Dialog.Title>
            <Dialog.Description className="sr-only">Line items and totals for this order.</Dialog.Description>
            {detailLoading ? (
              <p className="mt-6 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Loading…</p>
            ) : detail?.order ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold">#{detail.order.orderNumber}</span>
                  <StatusBadge status={detail.order.status} />
                </div>
                <p className="text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Placed {detail.order.createdAt ? new Date(detail.order.createdAt).toLocaleString() : ""}
                </p>
                <ul className="divide-y divide-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)]">
                  {(detail.lines ?? []).map((line) => (
                    <li key={line.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        {line.productSlug ? (
                          <Link
                            to={`/shop/product/${encodeURIComponent(line.productSlug)}`}
                            className="font-medium text-[color:var(--ink)] underline-offset-2 hover:underline"
                            onClick={() => setDetailOpen(false)}
                          >
                            {line.productName}
                          </Link>
                        ) : (
                          <span className="font-medium text-[color:var(--ink)]">{line.productName}</span>
                        )}
                        <p className="text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                          Qty {line.quantity} · {formatUsd(line.priceCents)} each
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatUsd(line.lineTotalCents)}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-1 border-t border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Subtotal</span>
                    <span>{formatUsd(detail.order.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Shipping</span>
                    <span>{formatUsd(detail.order.shippingCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Tax</span>
                    <span>{formatUsd(detail.order.taxCents)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatUsd(detail.order.totalCents)}</span>
                  </div>
                </div>
                <Dialog.Close
                  type="button"
                  className="mt-4 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] py-2.5 text-sm font-medium text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
                >
                  Close
                </Dialog.Close>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
