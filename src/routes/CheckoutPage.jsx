import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatUsd } from "../lib/money.js";
import { useCart } from "../cart/useCart.js";
import { useCartLines, useCartSubtotalCents } from "../cart/cart-selectors.js";

function randomOrderId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `RX-${t}-${r}`.toUpperCase();
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items } = useCart();
  const lines = useCartLines();
  const subtotal = useCartSubtotalCents();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("United States");
  const [error, setError] = useState("");

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !address1.trim() || !city.trim() || !postal.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    const orderId = randomOrderId();
    navigate(`/checkout/complete?order=${encodeURIComponent(orderId)}`, { replace: true });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,1040px)] px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:px-6 lg:px-8">
      <h1 className="font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">Checkout</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
        Demo checkout - no card is charged. Submitting the form simulates a successful order and clears your cart.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <fieldset className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6">
            <legend className="font-ui-medium px-1 text-lg text-[color:var(--ink)]">Contact</legend>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                Email <span className="text-red-600">*</span>
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                Full name <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
              />
            </label>
          </fieldset>

          <fieldset className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6">
            <legend className="font-ui-medium px-1 text-lg text-[color:var(--ink)]">Shipping</legend>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                Address <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                autoComplete="street-address"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                  City <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                  Postal code <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  autoComplete="postal-code"
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                Country
              </span>
              <input
                type="text"
                autoComplete="country-name"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
              />
            </label>
          </fieldset>

          <fieldset className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)] p-6">
            <legend className="font-ui-medium px-1 text-lg text-[color:var(--ink)]">Payment</legend>
            <p className="mt-2 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_68%,transparent)]">
              This demo does not collect card numbers. In production, integrate Stripe or your PSP here.
            </p>
          </fieldset>

          {error ? (
            <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="rounded-xl bg-[color:var(--ink)] py-4 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90"
          >
            Place order (demo)
          </button>
        </form>

        <aside className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_5%,transparent)] p-6">
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">In your cart</h2>
          <ul className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto text-sm">
            {lines.map(({ product, quantity }) => (
              <li key={product.id} className="flex justify-between gap-2 text-[color:color-mix(in_srgb,var(--ink)_78%,transparent)]">
                <span className="min-w-0 truncate">
                  {quantity}× {product.name}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-[color:var(--ink)]">
                  {formatUsd(product.priceCents * quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">Subtotal</span>
              <span className="font-bold tabular-nums text-[color:var(--ink)]">{formatUsd(subtotal)}</span>
            </div>
          </div>
          <Link
            to="/cart"
            className="mt-4 inline-block text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_65%,transparent)] hover:text-[color:var(--ink)] hover:underline"
          >
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
