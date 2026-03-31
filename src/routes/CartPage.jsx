import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatUsd } from "../lib/money.js";
import { useCart } from "../cart/useCart.js";
import { useCartLines, useCartSubtotalCents } from "../cart/cart-selectors.js";
import { useAuth } from "../auth/useAuth.js";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { setQuantity, removeItem } = useCart();
  const lines = useCartLines();
  const subtotal = useCartSubtotalCents();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] text-center md:px-6">
        <h1 className="font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)]">Your cart</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
          Nothing here yet, browse the shop and add parts to your build.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex rounded-xl bg-[color:var(--ink)] px-8 py-3 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,960px)] px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:px-6 lg:px-8">
      <h1 className="font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">Your cart</h1>
      <p className="mt-2 text-sm text-[color:color-mix(in_srgb,var(--ink)_60%,transparent)]">
        Review quantities before checkout. Checkout uses your signed-in account and server cart.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <ul className="flex flex-col gap-4">
          {lines.map(({ product, quantity, lineTotalCents }) => (
            <li
              key={product.id}
              className="flex gap-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-4 sm:gap-5 sm:p-5"
            >
              <Link
                to={`/shop/product/${product.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] sm:h-28 sm:w-28"
              >
                <img src={product.image} alt="" className="h-full w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <Link
                    to={`/shop/product/${product.slug}`}
                    className="font-ui-medium text-base leading-snug text-[color:var(--ink)] hover:underline sm:text-lg"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">{product.brand}</p>
                  <p className="mt-2 text-sm font-bold tabular-nums text-[color:var(--ink)]">{formatUsd(product.priceCents)} each</p>
                </div>
                <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
                  <div className="flex items-center overflow-hidden rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)]">
                    <button
                      type="button"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-l-lg text-[color:var(--ink)] transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums text-[color:var(--ink)]">{quantity}</span>
                    <button
                      type="button"
                      disabled={quantity >= product.stock}
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-r-lg text-[color:var(--ink)] transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] disabled:opacity-35"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tabular-nums text-[color:var(--ink)]">{formatUsd(lineTotalCents)}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      className="rounded-lg p-2 text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] hover:text-red-600 dark:hover:text-red-400"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] p-6">
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
            <span>Subtotal</span>
            <span className="font-bold tabular-nums text-[color:var(--ink)]">{formatUsd(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
            {user
              ? "You will pay securely via Stripe on the next step."
              : "Sign in to place an order—checkout is available for signed-in customers only."}
          </p>
          {user ? (
            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-[color:var(--ink)] py-3.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
            >
              Proceed to checkout
            </Link>
          ) : authLoading ? (
            <p className="mt-6 text-center text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Checking account…</p>
          ) : (
            <Link
              to="/sign-in"
              state={{ from: { pathname: "/checkout" } }}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-[color:var(--ink)] py-3.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
            >
              Sign in to checkout
            </Link>
          )}
          <Link
            to="/shop"
            className="mt-3 block w-full text-center text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_65%,transparent)] hover:text-[color:var(--ink)] hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
