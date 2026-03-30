import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../cart/useCart.js";

export default function CheckoutCompletePage() {
  const [params] = useSearchParams();
  const orderId = params.get("order") || "—";
  const { clearCart } = useCart();
  const orderParam = params.get("order");

  useEffect(() => {
    if (orderParam) clearCart();
  }, [clearCart, orderParam]);

  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] text-center md:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-2xl" aria-hidden>
        ✓
      </div>
      <h1 className="mt-6 font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)]">Order placed</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
        Thanks for trying the demo storefront. No payment was processed.
      </p>
      <p className="mt-6 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] px-4 py-3 font-mono text-sm text-[color:var(--ink)]">
        Order ID: {orderId}
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/shop"
          className="inline-flex justify-center rounded-xl bg-[color:var(--ink)] px-8 py-3 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
        >
          Back to shop
        </Link>
        <Link
          to="/"
          className="inline-flex justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_20%,transparent)] px-8 py-3 text-sm font-semibold text-[color:var(--ink)] hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
