import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatUsd } from "../lib/money.js";
import { useAuth } from "../auth/useAuth.js";
import { useCart } from "./useCart.js";
import { useCartLines, useCartSubtotalCents } from "./cart-selectors.js";
import "./side-cart.css";

export default function SideCart() {
  const { user, loading: authLoading } = useAuth();
  const { sideCartOpen, closeSideCart, setQuantity, removeItem } = useCart();
  const lines = useCartLines();
  const subtotal = useCartSubtotalCents();
  const { pathname } = useLocation();
  const titleId = useId();
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (pathname === "/cart" || pathname === "/checkout") closeSideCart();
  }, [pathname, closeSideCart]);

  useEffect(() => {
    if (!sideCartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sideCartOpen]);

  useEffect(() => {
    if (!sideCartOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeSideCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sideCartOpen, closeSideCart]);

  useEffect(() => {
    if (!sideCartOpen) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [sideCartOpen]);

  if (!sideCartOpen) return null;

  const node = (
    <div className="site-root-vars fixed inset-0 z-[10040]" role="presentation">
      <button
        type="button"
        className="side-cart-backdrop absolute inset-0 cursor-pointer border-0 p-0"
        aria-label="Close cart"
        onClick={closeSideCart}
      />
      <div
        className="side-cart-panel absolute right-0 top-0 flex h-full w-full max-w-[min(100%,420px)] flex-col rounded-l-[1.25rem] sm:rounded-l-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] text-[color:var(--ink)]">
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="font-ui-medium text-lg tracking-[-0.02em] text-[color:var(--ink)] sm:text-xl">
                Your cart
              </h2>
              <p className="truncate text-xs text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                {lines.length === 0 ? "Nothing here yet" : `${lines.length} line${lines.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="side-cart-close"
            onClick={closeSideCart}
            aria-label="Close cart"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <p className="text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_65%,transparent)]">
                Your cart is empty. Browse the shop for parts and gear.
              </p>
              <Link
                to="/shop"
                onClick={closeSideCart}
                className="mt-6 rounded-xl bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map(({ product, quantity, lineTotalCents }) => (
                <li
                  key={product.id}
                  className="flex gap-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-3"
                >
                  <Link
                    to={`/shop/product/${product.slug}`}
                    onClick={closeSideCart}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                  >
                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/shop/product/${product.slug}`}
                        onClick={closeSideCart}
                        className="font-ui-medium line-clamp-2 text-sm leading-snug text-[color:var(--ink)] hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">{product.brand}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center overflow-hidden rounded-lg border border-[color:color-mix(in_srgb,var(--ink)_16%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)]">
                        <button
                          type="button"
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-l-lg text-[color:var(--ink)] transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.75rem] text-center text-xs font-bold tabular-nums text-[color:var(--ink)]">{quantity}</span>
                        <button
                          type="button"
                          disabled={quantity >= product.stock}
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-r-lg text-[color:var(--ink)] transition-colors duration-150 hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] disabled:opacity-35"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums text-[color:var(--ink)]">{formatUsd(lineTotalCents)}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          className="rounded-lg p-1.5 text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] hover:text-red-600 dark:hover:text-red-400"
                          aria-label={`Remove ${product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <footer className="shrink-0 border-t border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)] px-4 py-4 sm:px-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-[color:color-mix(in_srgb,var(--ink)_65%,transparent)]">Subtotal</span>
              <span className="text-lg font-bold tabular-nums text-[color:var(--ink)]">{formatUsd(subtotal)}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
              {user ? "Pay securely via Stripe after you continue." : "Sign in to complete your purchase."}
            </p>
            {user ? (
              <Link
                to="/checkout"
                onClick={closeSideCart}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-[color:var(--ink)] py-3.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
              >
                Checkout
              </Link>
            ) : authLoading ? (
              <p className="mt-4 text-center text-xs text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">Checking account…</p>
            ) : (
              <Link
                to="/sign-in"
                state={{ from: { pathname: "/checkout" } }}
                onClick={closeSideCart}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-[color:var(--ink)] py-3.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
              >
                Sign in to checkout
              </Link>
            )}
            <Link
              to="/cart"
              onClick={closeSideCart}
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-transparent py-3 text-sm font-semibold text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]"
            >
              View full cart
            </Link>
          </footer>
        ) : null}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
