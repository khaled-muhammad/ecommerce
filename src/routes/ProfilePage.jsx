import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";
import { useAuth } from "../auth/useAuth.js";
import CountrySelect from "../components/CountrySelect.jsx";
import { DEFAULT_COUNTRY_CODE, formatCountryLabel } from "../lib/countries.js";

const pageTop = "pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]";

const field =
  "font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] focus:border-[color:color-mix(in_srgb,var(--ink)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ink)_22%,transparent)]";

const btnPrimary =
  "font-ui inline-flex items-center justify-center rounded-xl bg-[color:var(--ink)] px-5 py-2.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90 disabled:opacity-50";

const btnGhost =
  "font-ui inline-flex items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-transparent px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)]";

const card =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6";

const TABS = [
  { id: "account", label: "Account" },
  { id: "addresses", label: "Addresses" },
  { id: "payment", label: "Payment" },
  { id: "close", label: "Close account" },
];

function SectionTitle({ children }) {
  return <h2 className="font-ui-medium mb-4 text-lg text-[color:var(--ink)]">{children}</h2>;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, authorizedFetch, updateUser, logout } = useAuth();
  const [tab, setTab] = useState("account");
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadErr, setLoadErr] = useState(null);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [addrForm, setAddrForm] = useState({
    label: "Home",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    postal: "",
    country: DEFAULT_COUNTRY_CODE,
    phone: "",
    isDefault: false,
  });
  const [addrSaving, setAddrSaving] = useState(false);

  const [payForm, setPayForm] = useState({
    label: "Card",
    brand: "visa",
    last4: "",
    expMonth: 12,
    expYear: new Date().getFullYear() + 2,
    isDefault: false,
  });
  const [paySaving, setPaySaving] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadLists = useCallback(async () => {
    if (!user) return;
    setLoadErr(null);
    try {
      const [aRes, pRes] = await Promise.all([
        authorizedFetch("/api/v1/profile/addresses"),
        authorizedFetch("/api/v1/profile/payment-methods"),
      ]);
      const aJson = aRes.ok ? await aRes.json().catch(() => ({})) : {};
      const pJson = pRes.ok ? await pRes.json().catch(() => ({})) : {};
      if (!aRes.ok) throw new Error(aJson.message ?? "Could not load addresses");
      if (!pRes.ok) throw new Error(pJson.message ?? "Could not load payment methods");
      setAddresses(aJson.addresses ?? []);
      setPayments(pJson.paymentMethods ?? []);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Load failed");
    }
  }, [user, authorizedFetch]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      void loadLists();
    }
  }, [user, loadLists]);

  async function saveName(e) {
    e.preventDefault();
    if (!user) return;
    setSavingName(true);
    try {
      const res = await authorizedFetch("/api/v1/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not update name");
      updateUser(data.user);
      toast.success("Name saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    try {
      const res = await authorizedFetch("/api/v1/profile/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not change password");
      setPwCurrent("");
      setPwNew("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPwSaving(false);
    }
  }

  async function addAddress(e) {
    e.preventDefault();
    setAddrSaving(true);
    try {
      const res = await authorizedFetch("/api/v1/profile/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...addrForm,
          line2: addrForm.line2 || undefined,
          phone: addrForm.phone || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not add address");
      setAddresses((prev) => [...prev, data.address]);
      setAddrForm({
        label: "Home",
        fullName: "",
        line1: "",
        line2: "",
        city: "",
        postal: "",
        country: DEFAULT_COUNTRY_CODE,
        phone: "",
        isDefault: false,
      });
      toast.success("Address saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setAddrSaving(false);
    }
  }

  async function removeAddress(id) {
    try {
      const res = await authorizedFetch(`/api/v1/profile/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Delete failed");
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function addPayment(e) {
    e.preventDefault();
    setPaySaving(true);
    try {
      const res = await authorizedFetch("/api/v1/profile/payment-methods", {
        method: "POST",
        body: JSON.stringify({
          ...payForm,
          last4: payForm.last4.replace(/\D/g, "").slice(0, 4),
          expMonth: Number(payForm.expMonth),
          expYear: Number(payForm.expYear),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not save card");
      setPayments((prev) => [...prev, data.paymentMethod]);
      setPayForm((f) => ({
        ...f,
        last4: "",
        isDefault: false,
      }));
      toast.success("Payment method saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPaySaving(false);
    }
  }

  async function removePayment(id) {
    try {
      const res = await authorizedFetch(`/api/v1/profile/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Delete failed");
      }
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success("Removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    if (!user) return;
    setDeleting(true);
    try {
      const body = user.hasPassword
        ? { currentPassword: deletePassword }
        : { confirmEmail: deleteEmailConfirm.trim() };
      const res = await authorizedFetch("/api/v1/profile/account", {
        method: "DELETE",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not delete account");
      sessionStorage.removeItem("roxy_access_token");
      await logout();
      toast.success("Account deleted");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const tabBtnBase =
    "font-ui relative shrink-0 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors sm:px-2 sm:pb-3.5";
  const tabBtnIdle =
    "border-transparent text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)] hover:text-[color:var(--ink)]";
  const tabBtnActive = "border-[color:var(--ink)] text-[color:var(--ink)]";

  return (
    <div className={`mx-auto w-full max-w-4xl px-4 pb-24 ${pageTop} md:px-6`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div>
          <h1 className="font-ui-medium text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">Profile</h1>
          <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">{user.email}</p>
        </div>
        <Link to="/shop" className={`${btnGhost} text-xs`}>
          ← Back to shop
        </Link>
      </div>

      <div className="mb-6 border-b border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)]">
        <div className="-mb-px flex gap-1 overflow-x-auto pb-px sm:gap-2" role="tablist" aria-label="Profile sections">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              id={`profile-tab-${id}`}
              aria-controls={`profile-panel-${id}`}
              className={`${tabBtnBase} ${tab === id ? tabBtnActive : tabBtnIdle}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[12rem]">
        {tab === "account" && (
          <div id="profile-panel-account" role="tabpanel" aria-labelledby="profile-tab-account" className="flex flex-col gap-6">
            <section className={card}>
              <SectionTitle>Display name</SectionTitle>
              <form className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end" onSubmit={saveName}>
                <label className="min-w-0 flex-1 font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Name
                  <input className={`${field} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
                </label>
                <button type="submit" className={btnPrimary} disabled={savingName}>
                  {savingName ? "Saving…" : "Save"}
                </button>
              </form>
            </section>

            {user.hasPassword ? (
              <section className={card}>
                <SectionTitle>Password</SectionTitle>
                <form className="flex max-w-md flex-col gap-4" onSubmit={savePassword}>
                  <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                    Current password
                    <input type="password" className={`${field} mt-1.5`} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="current-password" />
                  </label>
                  <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                    New password
                    <input type="password" className={`${field} mt-1.5`} value={pwNew} onChange={(e) => setPwNew(e.target.value)} autoComplete="new-password" minLength={8} />
                  </label>
                  <div>
                    <button type="submit" className={`${btnPrimary} w-fit`} disabled={pwSaving}>
                      {pwSaving ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <section className={card}>
                <SectionTitle>Password</SectionTitle>
                <p className="text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_62%,transparent)]">
                  You signed in with Google. There is no password on this account. You can keep using Google to sign in.
                </p>
              </section>
            )}
          </div>
        )}

        {tab === "addresses" && (
          <div id="profile-panel-addresses" role="tabpanel" aria-labelledby="profile-tab-addresses">
            <section className={card}>
              <SectionTitle>Saved addresses</SectionTitle>
              {loadErr ? <p className="mb-4 text-sm text-red-600 dark:text-red-400">{loadErr}</p> : null}
              {addresses.length === 0 ? (
                <p className="mb-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">No addresses yet.</p>
              ) : (
                <ul className="mb-6 flex flex-col gap-3">
                  {addresses.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)] p-4"
                    >
                      <div className="min-w-0 text-sm text-[color:var(--ink)]">
                        <p className="font-ui-medium">
                          {a.label}
                          {a.isDefault ? (
                            <span className="ml-2 text-xs font-normal text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">Default</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-[color:color-mix(in_srgb,var(--ink)_78%,transparent)]">
                          {a.fullName}
                          <br />
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}
                          <br />
                          {a.city}, {a.postal} · {formatCountryLabel(a.country)}
                          {a.phone ? (
                            <>
                              <br />
                              {a.phone}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded-lg p-2 text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Remove address"
                        onClick={() => void removeAddress(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={addAddress}>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)] sm:col-span-2">
                  Label
                  <input className={`${field} mt-1.5`} value={addrForm.label} onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))} />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)] sm:col-span-2">
                  Full name
                  <input className={`${field} mt-1.5`} value={addrForm.fullName} onChange={(e) => setAddrForm((f) => ({ ...f, fullName: e.target.value }))} required />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)] sm:col-span-2">
                  Address line 1
                  <input className={`${field} mt-1.5`} value={addrForm.line1} onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))} required />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)] sm:col-span-2">
                  Address line 2
                  <input className={`${field} mt-1.5`} value={addrForm.line2} onChange={(e) => setAddrForm((f) => ({ ...f, line2: e.target.value }))} />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  City
                  <input className={`${field} mt-1.5`} value={addrForm.city} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))} required />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Postal code
                  <input className={`${field} mt-1.5`} value={addrForm.postal} onChange={(e) => setAddrForm((f) => ({ ...f, postal: e.target.value }))} required />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Country
                  <CountrySelect
                    className={`${field} mt-1.5`}
                    value={addrForm.country}
                    onChange={(code) => setAddrForm((f) => ({ ...f, country: code }))}
                    required
                  />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Phone
                  <input className={`${field} mt-1.5`} value={addrForm.phone} onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))} />
                </label>
                <label className="flex cursor-pointer items-center gap-2 font-ui text-sm text-[color:color-mix(in_srgb,var(--ink)_70%,transparent)] sm:col-span-2">
                  <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))} className="rounded border-[color:color-mix(in_srgb,var(--ink)_25%,transparent)]" />
                  Set as default shipping address
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" className={btnPrimary} disabled={addrSaving}>
                    {addrSaving ? "Saving…" : "Add address"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {tab === "payment" && (
          <div id="profile-panel-payment" role="tabpanel" aria-labelledby="profile-tab-payment">
            <section className={card}>
              <SectionTitle>Payment methods</SectionTitle>
              <p className="mb-4 text-xs leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">
                Demo only: saved display labels for checkout, not real card tokenization. Do not enter real card data.
              </p>
              {payments.length === 0 ? (
                <p className="mb-4 text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">No saved methods.</p>
              ) : (
                <ul className="mb-6 flex flex-col gap-2">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)] px-4 py-3"
                    >
                      <span className="text-sm text-[color:var(--ink)]">
                        {p.label} · {p.brand} ·••• {p.last4} ({String(p.expMonth).padStart(2, "0")}/{p.expYear})
                        {p.isDefault ? <span className="ml-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">Default</span> : null}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Remove card"
                        onClick={() => void removePayment(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={addPayment}>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Label
                  <input className={`${field} mt-1.5`} value={payForm.label} onChange={(e) => setPayForm((f) => ({ ...f, label: e.target.value }))} />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Brand
                  <select className={`${field} mt-1.5`} value={payForm.brand} onChange={(e) => setPayForm((f) => ({ ...f, brand: e.target.value }))}>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">Amex</option>
                    <option value="discover">Discover</option>
                  </select>
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Last 4 digits
                  <input className={`${field} mt-1.5`} value={payForm.last4} onChange={(e) => setPayForm((f) => ({ ...f, last4: e.target.value.replace(/\D/g, "").slice(0, 4) }))} maxLength={4} inputMode="numeric" required />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Exp. month
                  <input type="number" min={1} max={12} className={`${field} mt-1.5`} value={payForm.expMonth} onChange={(e) => setPayForm((f) => ({ ...f, expMonth: Number(e.target.value) }))} required />
                </label>
                <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                  Exp. year
                  <input type="number" min={2020} max={2100} className={`${field} mt-1.5`} value={payForm.expYear} onChange={(e) => setPayForm((f) => ({ ...f, expYear: Number(e.target.value) }))} required />
                </label>
                <label className="flex cursor-pointer items-center gap-2 font-ui text-sm text-[color:color-mix(in_srgb,var(--ink)_70%,transparent)] sm:col-span-2">
                  <input type="checkbox" checked={payForm.isDefault} onChange={(e) => setPayForm((f) => ({ ...f, isDefault: e.target.checked }))} className="rounded border-[color:color-mix(in_srgb,var(--ink)_25%,transparent)]" />
                  Default method
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" className={btnPrimary} disabled={paySaving}>
                    {paySaving ? "Saving…" : "Add method"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {tab === "close" && (
          <div id="profile-panel-close" role="tabpanel" aria-labelledby="profile-tab-close">
            <section className={`${card} border-red-200/80 dark:border-red-900/50`}>
              <SectionTitle>Close account</SectionTitle>
              <p className="mb-2 text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
                Permanently delete your account and saved data. Orders stay in the store history with the buyer unlinked.
              </p>
              <form className="max-w-md" onSubmit={deleteAccount}>
                <div className="flex flex-col gap-2">
                  {user.hasPassword ? (
                    <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                      Confirm with password
                      <input type="password" className={`${field} mt-1.5`} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} autoComplete="current-password" required />
                    </label>
                  ) : (
                    <label className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_50%,transparent)]">
                      Type your email to confirm
                      <input type="email" className={`${field} mt-1.5`} value={deleteEmailConfirm} onChange={(e) => setDeleteEmailConfirm(e.target.value)} placeholder={user.email} required />
                    </label>
                  )}
                </div>
                <div className="mt-8 border-t border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] pt-8 dark:border-red-950/40">
                  <button
                    type="submit"
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-red-700"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Delete my account"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
