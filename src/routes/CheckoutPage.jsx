import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatUsd } from "../lib/money.js";
import { useCart } from "../cart/useCart.js";
import { useCartLines, useCartSubtotalCents } from "../cart/cart-selectors.js";
import { useAuth } from "../auth/useAuth.js";
import { useSiteConfig } from "../context/useSiteConfig.js";

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** @param {unknown} v */
function isAddressRow(v) {
  return (
    v != null &&
    typeof v === "object" &&
    "id" in v &&
    typeof v.id === "string" &&
    "line1" in v &&
    typeof v.line1 === "string"
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, authorizedFetch } = useAuth();
  const { codEnabled, stripePaymentsEnabled, loaded: configLoaded } = useSiteConfig();
  const { items, clearCart } = useCart();
  const lines = useCartLines();
  const subtotal = useCartSubtotalCents();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");
  const [couponCode, setCouponCode] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(/** @type {"stripe" | "cod"} */ ("stripe"));
  /** When true, cart was cleared after a successful COD; do not send user to /cart instead of /checkout/complete. */
  const skipEmptyCartRedirect = useRef(false);

  useEffect(() => {
    if (!configLoaded) return;
    if (codEnabled && !stripePaymentsEnabled) setPaymentMethod("cod");
    else setPaymentMethod("stripe");
  }, [configLoaded, codEnabled, stripePaymentsEnabled]);

  const checkoutIntro = useMemo(() => {
    if (!configLoaded) return "Loading checkout options…";
    if (codEnabled && stripePaymentsEnabled) {
      return "Choose how you pay. Pay securely with a card (Stripe) or choose cash on delivery and pay when your order arrives.";
    }
    if (codEnabled) return "You will pay when your order is delivered (cash on delivery). Shipping and tax are included in your order total.";
    return "You will go to Stripe to pay securely. Shipping and tax are included in the total on the payment page.";
  }, [configLoaded, codEnabled, stripePaymentsEnabled]);

  const paymentsAvailable = configLoaded && (stripePaymentsEnabled || codEnabled);

  const applyAddress = useCallback((addr) => {
    if (!addr || typeof addr !== "object") return;
    const a = /** @type {Record<string, unknown>} */ (addr);
    if (typeof a.fullName === "string" && a.fullName.trim()) setFullName(a.fullName.trim());
    if (typeof a.line1 === "string") setAddress1(a.line1);
    if (typeof a.line2 === "string") setAddress2(a.line2);
    else setAddress2("");
    if (typeof a.city === "string") setCity(a.city);
    if (typeof a.postal === "string") setPostal(a.postal);
    if (typeof a.country === "string" && a.country.trim()) setCountry(a.country.trim());
  }, []);

  useEffect(() => {
    if (items.length > 0) skipEmptyCartRedirect.current = false;
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0 && !skipEmptyCartRedirect.current) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, navigate]);

  useEffect(() => {
    if (!user) return;
    setEmail(typeof user.email === "string" ? user.email : "");
    if (typeof user.name === "string" && user.name.trim()) setFullName(user.name.trim());
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setAddressesLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authorizedFetch("/api/v1/profile/addresses");
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data?.message ?? "Could not load saved addresses");
        const list = Array.isArray(data?.addresses) ? data.addresses.filter(isAddressRow) : [];
        if (cancelled) return;
        setAddresses(list);
        const def = list.find((x) => x.isDefault) ?? list[0];
        if (def) {
          setSelectedAddressId(def.id);
          applyAddress(def);
        } else {
          setSelectedAddressId("");
        }
      } catch {
        if (!cancelled) setAddresses([]);
      } finally {
        if (!cancelled) setAddressesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authorizedFetch, applyAddress]);

  const addressOptions = useMemo(
    () =>
      addresses.map((a) => ({
        id: a.id,
        label: typeof a.label === "string" && a.label.trim() ? a.label.trim() : "Saved address",
      })),
    [addresses],
  );

  const onSavedAddressChange = (id) => {
    setSelectedAddressId(id);
    if (!id) return;
    const addr = addresses.find((a) => a.id === id);
    if (addr) applyAddress(addr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !address1.trim() || !city.trim() || !postal.trim() || !country.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body = {
        email: email.trim(),
        fullName: fullName.trim(),
        address1: address1.trim(),
        city: city.trim(),
        postal: postal.trim(),
        country: country.trim(),
      };
      const a2 = address2.trim();
      if (a2) body.address2 = a2;
      const cc = couponCode.trim();
      if (cc) body.couponCode = cc;
      body.paymentMethod = paymentMethod;

      const res = await authorizedFetch("/api/v1/checkout", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await parseJson(res);

      if (res.status === 502 && data?.error === "PAYMENT_ERROR") {
        setError(
          "Card payment is not available right now (Stripe is not configured or the session could not be created). Try cash on delivery if it is offered, or try again later.",
        );
        return;
      }
      if (res.status === 503 && data?.error === "PAYMENTS_DISABLED") {
        setError(typeof data?.message === "string" ? data.message : "No payment methods are enabled for this store.");
        return;
      }
      if (res.status === 400 && data?.error === "STRIPE_REQUIRED") {
        setError(typeof data?.message === "string" ? data.message : "Choose cash on delivery or contact support.");
        return;
      }
      if (res.status === 400 && data?.error === "COD_DISABLED") {
        setError(typeof data?.message === "string" ? data.message : "Cash on delivery is not available.");
        return;
      }
      if (res.status === 422 && data?.error === "EMPTY_CART") {
        setError("Your cart is empty. Add items before checkout.");
        navigate("/cart", { replace: true });
        return;
      }
      if (res.status === 422 && data?.error === "STOCK_ERROR") {
        setError(typeof data?.message === "string" ? data.message : "An item is out of stock.");
        return;
      }
      if (!res.ok) {
        setError(typeof data?.message === "string" ? data.message : "Checkout failed. Please try again.");
        return;
      }
      const orderNumber = data?.order && typeof data.order.orderNumber === "string" ? data.order.orderNumber : null;
      if (data?.paymentMethod === "cod" && orderNumber) {
        skipEmptyCartRedirect.current = true;
        navigate(`/checkout/complete?order=${encodeURIComponent(orderNumber)}&payment=cod`, { replace: true });
        clearCart();
        return;
      }
      const url = data?.checkoutUrl;
      if (typeof url !== "string" || !url) {
        setError("No checkout URL returned. Try another payment method or contact support.");
        return;
      }
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,1040px)] px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:px-6 lg:px-8">
      <h1 className="font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">Checkout</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]">
        {checkoutIntro}
      </p>
      {configLoaded && !paymentsAvailable ? (
        <p className="mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          Checkout is unavailable: neither Stripe nor cash on delivery is enabled. Please contact the store.
        </p>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6" noValidate>
          {addressesLoaded && addressOptions.length > 0 ? (
            <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                  Use saved address
                </span>
                <select
                  value={selectedAddressId}
                  onChange={(e) => onSavedAddressChange(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
                >
                  {addressOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                Edit fields below if you need a one-off change for this order.
              </p>
            </div>
          ) : null}

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
                Address line 1 <span className="text-red-600">*</span>
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
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                Address line 2
              </span>
              <input
                type="text"
                autoComplete="address-line2"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
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
                Country <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                autoComplete="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                placeholder="e.g. US"
                className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
              />
            </label>
          </fieldset>

          <fieldset className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6">
            <legend className="font-ui-medium px-1 text-lg text-[color:var(--ink)]">Coupon</legend>
            <label className="mt-2 block">
              <span className="text-xs font-bold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
                Code (optional)
              </span>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-4 py-3 text-sm text-[color:var(--ink)]"
                autoComplete="off"
              />
            </label>
          </fieldset>

          <fieldset className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)] p-6">
            <legend className="font-ui-medium px-1 text-lg text-[color:var(--ink)]">Payment</legend>
            {!configLoaded ? (
              <p className="mt-2 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Loading payment options…</p>
            ) : codEnabled && stripePaymentsEnabled ? (
              <div className="mt-3 flex flex-col gap-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-4">
                  <input
                    type="radio"
                    name="payment"
                    className="mt-1"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                  />
                  <span>
                    <span className="font-medium text-[color:var(--ink)]">Pay with card</span>
                    <span className="mt-1 block text-sm text-[color:color-mix(in_srgb,var(--ink)_65%,transparent)]">
                      You will complete payment on Stripe. This site does not store your card number.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-4">
                  <input
                    type="radio"
                    name="payment"
                    className="mt-1"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span>
                    <span className="font-medium text-[color:var(--ink)]">Cash on delivery</span>
                    <span className="mt-1 block text-sm text-[color:color-mix(in_srgb,var(--ink)_65%,transparent)]">
                      Pay when your order is delivered. Your order is confirmed right away and we will prepare it for shipment.
                    </span>
                  </span>
                </label>
              </div>
            ) : codEnabled ? (
              <p className="mt-2 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_68%,transparent)]">
                Cash on delivery: pay when your order arrives. Your order is confirmed as soon as you place it.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_68%,transparent)]">
                Card details are entered on Stripe after you continue. This site does not store your card number.
              </p>
            )}
          </fieldset>

          {error ? (
            <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !paymentsAvailable}
            className="rounded-xl bg-[color:var(--ink)] py-4 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Working…"
              : paymentMethod === "cod"
                ? "Place order"
                : "Continue to payment"}
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
            <p className="mt-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
              Shipping and tax are calculated for your order on the next step.
            </p>
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
