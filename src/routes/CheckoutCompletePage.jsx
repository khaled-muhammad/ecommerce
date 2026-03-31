import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { useCart } from "../cart/useCart.js";

export default function CheckoutCompletePage() {
  const [params] = useSearchParams();
  const orderParam = params.get("order");
  const payment = params.get("payment");
  const isCod = payment === "cod";
  const { clearCart } = useCart();

  useEffect(() => {
    if (orderParam) clearCart();
  }, [clearCart, orderParam]);

  if (!orderParam) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] text-center md:px-6">
        <h1 className="font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)]">Checkout</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
          No order reference was found. If you just paid, check your email or open your orders from your account menu.
        </p>
        <Link
          to="/orders"
          className="mt-8 inline-flex justify-center rounded-xl bg-[color:var(--ink)] px-8 py-3 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
        >
          View my orders
        </Link>
        <Link
          to="/shop"
          className="mt-3 block text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)] hover:text-[color:var(--ink)] hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] text-center md:px-6">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        aria-hidden
      >
        <Package className="h-8 w-8" strokeWidth={2} />
      </div>
      <h1 className="mt-6 font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)]">Order placed</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
        {isCod
          ? "Thank you. Your order is confirmed. Pay with cash when your order is delivered. We will email you updates about preparation and shipping."
          : "Thank you. Your payment was received and your order is confirmed. We will email you when it ships."}
      </p>
      <p className="mt-6 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
          Order number
        </span>
        <span className="mt-1 block font-mono text-base font-semibold text-[color:var(--ink)]">{orderParam}</span>
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/orders"
          className="inline-flex justify-center rounded-xl bg-[color:var(--ink)] px-8 py-3 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
        >
          View my orders
        </Link>
        <Link
          to="/shop"
          className="inline-flex justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_20%,transparent)] px-8 py-3 text-sm font-semibold text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
        >
          Continue shopping
        </Link>
      </div>
      <Link
        to="/"
        className="mt-6 inline-block text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)] hover:text-[color:var(--ink)] hover:underline"
      >
        Home
      </Link>
    </div>
  );
}
