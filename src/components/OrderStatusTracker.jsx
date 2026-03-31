import { Fragment } from "react";
import { Check, Loader2 } from "lucide-react";

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STEPS = [
  { key: "placed", title: "Order placed", desc: "Received" },
  { key: "prep", title: "Processing", desc: "Preparing" },
  { key: "transit", title: "Out for delivery", desc: "On the way" },
  { key: "done", title: "Delivered", desc: "Complete" },
];

/** @param {string} status */
export function orderTrackerStepStates(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "pending") return { states: ["current", "upcoming", "upcoming", "upcoming"], pendingPayment: true };
  if (s === "paid" || s === "processing") return { states: ["complete", "current", "upcoming", "upcoming"], pendingPayment: false };
  if (s === "shipped") return { states: ["complete", "complete", "current", "upcoming"], pendingPayment: false };
  if (s === "delivered") return { states: ["complete", "complete", "complete", "complete"], pendingPayment: false };
  if (s === "cancelled") return { terminal: "cancelled" };
  if (s === "refunded") return { terminal: "refunded" };
  return { states: ["current", "upcoming", "upcoming", "upcoming"], pendingPayment: false };
}

const sectionShell =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--paper)_88%,var(--ink)_2%)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-none";

/**
 * Amazon-style horizontal fulfillment tracker for customers.
 * @param {{ status: string, className?: string }} props
 */
export default function OrderStatusTracker({ status, className = "" }) {
  const meta = orderTrackerStepStates(status);

  if (meta.terminal === "cancelled") {
    return (
      <div
        className={cn(
          sectionShell,
          "border-rose-200/80 bg-rose-50/90 dark:border-rose-900/35 dark:bg-rose-950/25",
          className,
        )}
      >
        <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">Order cancelled</p>
        <p className="mt-1 text-xs leading-relaxed text-rose-800/85 dark:text-rose-300/85">
          This order was cancelled. If you have questions, contact support.
        </p>
      </div>
    );
  }

  if (meta.terminal === "refunded") {
    return (
      <div
        className={cn(
          sectionShell,
          "border-slate-200/80 bg-slate-50/90 dark:border-slate-700/50 dark:bg-slate-900/30",
          className,
        )}
      >
        <p className="text-sm font-semibold text-[color:var(--ink)]">Order refunded</p>
        <p className="mt-1 text-xs leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
          A refund was issued for this order.
        </p>
      </div>
    );
  }

  const { states, pendingPayment } = meta;

  return (
    <div className={cn(sectionShell, className)}>
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold tracking-tight text-[color:var(--ink)]">Shipment status</h3>
        <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
          {pendingPayment
            ? "Complete payment to confirm your order."
            : states[3] === "complete"
              ? "Your order has been delivered."
              : "Track progress below. We will email you when something changes."}
        </p>
      </div>

      <div className="flex w-full items-center">
        {STEPS.map((step, i) => {
          const st = states[i];
          const isComplete = st === "complete";
          const isCurrent = st === "current";
          const lineComplete = i > 0 && states[i - 1] === "complete";

          return (
            <Fragment key={step.key}>
              {i > 0 ? (
                <div
                  className={cn(
                    "h-0.5 min-w-[6px] flex-1 self-center",
                    lineComplete ? "bg-emerald-500 dark:bg-emerald-500" : "bg-[color:color-mix(in_srgb,var(--ink)_14%,transparent)]",
                  )}
                  aria-hidden
                />
              ) : null}
              <div className="flex w-[4.25rem] shrink-0 flex-col items-center sm:w-[5.5rem]">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
                    isComplete &&
                      "border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] dark:border-emerald-400 dark:bg-emerald-600",
                    isCurrent &&
                      !isComplete &&
                      "border-[color:var(--ink)] bg-[color:color-mix(in_srgb,var(--paper)_92%,var(--ink)_4%)] text-[color:var(--ink)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--ink)_10%,transparent)]",
                    !isComplete &&
                      !isCurrent &&
                      "border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] text-[color:color-mix(in_srgb,var(--ink)_40%,transparent)]",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  ) : isCurrent && pendingPayment && i === 0 ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className="mt-2 text-center text-[10px] font-semibold leading-tight text-[color:var(--ink)] sm:text-[11px]">
                  {i === 0 && pendingPayment ? "Payment" : step.title}
                </span>
                <span className="mt-0.5 hidden text-center text-[9px] text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)] sm:block sm:text-[10px]">
                  {i === 0 && pendingPayment ? "Pending" : step.desc}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
