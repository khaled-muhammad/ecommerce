import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "radix-ui";
import { Loader2, Package, X } from "lucide-react";
import { toast } from "react-toastify";
import { formatUsd } from "../lib/money.js";
import { useAuth } from "../auth/useAuth.js";
import OrderStatusTracker from "../components/OrderStatusTracker.jsx";

const pageTop = "pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]";

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

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

/** Match AdminProductModal SectionCard */
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

const footerSecondary =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_70%,transparent)] px-5 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]";

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
            Track delivery like a major retailer: open an order for the full timeline and line items. Product links work when
            the item is still in the catalog.
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
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-[220] bg-[color:color-mix(in_srgb,#0a1a0a_52%,transparent)] backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "duration-200 ease-out",
            )}
          />
          <Dialog.Content
            className={cn(
              "group fixed inset-0 z-[221] flex items-center justify-center p-2 outline-none sm:p-4 pointer-events-none",
            )}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div
              className={cn(
                "site-root-vars pointer-events-auto flex max-h-[min(92dvh,820px)] w-[min(calc(100vw-1rem),540px)] flex-col overflow-hidden rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_96%,var(--ink)_2%)] shadow-[0_32px_90px_rgba(14,34,14,0.2),0_0_0_1px_rgba(255,255,255,0.5)_inset]",
                "duration-200 ease-out",
                "group-data-[state=open]:animate-in group-data-[state=closed]:animate-out",
                "group-data-[state=closed]:fade-out-0 group-data-[state=open]:fade-in-0",
                "group-data-[state=closed]:zoom-out-95 group-data-[state=open]:zoom-in-95",
              )}
            >
              <Dialog.Title className="sr-only">Order details</Dialog.Title>
              <Dialog.Description className="sr-only">Shipment status, line items, and totals for this order.</Dialog.Description>

              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] px-5 py-4 sm:px-7 sm:py-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-[1.35rem]">
                      Order details
                    </h2>
                    {detail?.order ? (
                      <span className="rounded-full bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">
                        #{detail.order.orderNumber}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
                    Status, tracking steps, and what you ordered
                  </p>
                </div>
                <Dialog.Close
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-[color:var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:color-mix(in_srgb,var(--ink)_25%,transparent)]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </Dialog.Close>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-7 [scrollbar-gutter:stable]">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <Loader2 className="h-9 w-9 animate-spin text-[color:color-mix(in_srgb,var(--ink)_35%,transparent)]" strokeWidth={2} />
                    <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">Loading order…</p>
                  </div>
                ) : detail?.order ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={detail.order.status} />
                      <p className="text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                        Placed {detail.order.createdAt ? new Date(detail.order.createdAt).toLocaleString() : ""}
                      </p>
                    </div>

                    <OrderStatusTracker status={detail.order.status} />

                    <SectionCard title="Items" subtitle="Tap a name to open the product page when it is still listed.">
                      <ul className="divide-y divide-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_92%,var(--ink)_2%)]">
                        {(detail.lines ?? []).map((line) => (
                          <li
                            key={line.id}
                            className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                          >
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
                              <p className="text-xs text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
                                Qty {line.quantity} · {formatUsd(line.priceCents)} each
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-[color:var(--ink)]">
                              {formatUsd(line.lineTotalCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>

                    <SectionCard title="Totals" subtitle="What you were charged for this order.">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
                          <span>Subtotal</span>
                          <span className="tabular-nums text-[color:var(--ink)]">{formatUsd(detail.order.subtotalCents)}</span>
                        </div>
                        <div className="flex justify-between text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
                          <span>Shipping</span>
                          <span className="tabular-nums text-[color:var(--ink)]">{formatUsd(detail.order.shippingCents)}</span>
                        </div>
                        <div className="flex justify-between text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
                          <span>Tax</span>
                          <span className="tabular-nums text-[color:var(--ink)]">{formatUsd(detail.order.taxCents)}</span>
                        </div>
                        <div className="flex justify-between border-t border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] pt-3 text-base font-semibold text-[color:var(--ink)]">
                          <span>Total</span>
                          <span className="tabular-nums">{formatUsd(detail.order.totalCents)}</span>
                        </div>
                      </div>
                    </SectionCard>

                    <Dialog.Close type="button" className={footerSecondary}>
                      Close
                    </Dialog.Close>
                  </div>
                ) : null}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
