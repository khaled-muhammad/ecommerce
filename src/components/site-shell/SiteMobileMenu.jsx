import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, LogOut, Search, UserRound, X } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { hasStaffDashboardAccess } from "../../lib/staffCapabilities.js";
import NavThemeToggle from "./NavThemeToggle.jsx";

const PRIMARY_LINKS = [
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/brands", label: "Brands" },
];

const HELP_LINKS = [
  { to: "/contact", label: "Contact" },
  { to: "/support", label: "Support" },
];

const linkClass =
  "site-mobile-menu__link font-ui flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:color-mix(in_srgb,var(--ink)_35%,var(--paper))]";

const subLinkClass =
  "site-mobile-menu__sublink font-ui flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]";

export default function SiteMobileMenu({ open, onClose, menuDomId }) {
  const closeBtnRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, loading, logout } = useAuth();
  const showAdmin = hasStaffDashboardAccess(user?.role);
  const isShopList = location.pathname === "/shop";
  const qFromShop = params.get("q") ?? "";

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const submitSearch = (qRaw) => {
    const q = qRaw.trim();
    if (isShopList) {
      const next = new URLSearchParams(params);
      if (q) next.set("q", q);
      else next.delete("q");
      setParams(next, { replace: true });
    } else {
      const next = new URLSearchParams();
      if (q) next.set("q", q);
      const qs = next.toString();
      navigate(qs ? `/shop?${qs}` : "/shop");
    }
    close();
  };

  if (!open) return null;

  const node = (
    <div
      className="site-mobile-menu site-root-vars"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${menuDomId}-title`}
      id={menuDomId}
    >
      <div className="site-mobile-menu__backdrop" aria-hidden onClick={close} />

      <div className="site-mobile-menu__sheet">
        <header className="site-mobile-menu__header">
          <p id={`${menuDomId}-title`} className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
            Menu
          </p>
          <button
            ref={closeBtnRef}
            type="button"
            className="site-mobile-menu__close"
            onClick={close}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="site-mobile-menu__scroll">
          <form
            className="site-mobile-menu__search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              submitSearch(String(fd.get("q") ?? ""));
            }}
          >
            <Search className="site-mobile-menu__search-icon h-5 w-5 shrink-0 opacity-60" strokeWidth={2} aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={isShopList ? qFromShop : ""}
              placeholder="Search products…"
              className="site-mobile-menu__search-input font-ui"
              autoComplete="off"
              enterKeyHint="search"
              aria-label="Search products"
            />
          </form>

          <nav className="site-mobile-menu__nav" aria-label="Primary">
            {PRIMARY_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `${linkClass}${isActive ? " site-mobile-menu__link--active" : ""}`}
                onClick={close}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="site-mobile-menu__divider" aria-hidden />

          <p className="mb-2 px-1 font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
            Help
          </p>
          <nav className="site-mobile-menu__nav mb-2" aria-label="Help">
            {HELP_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `${linkClass}${isActive ? " site-mobile-menu__link--active" : ""}`}
                onClick={close}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="site-mobile-menu__divider" aria-hidden />

          <div className="site-mobile-menu__row">
            <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
              Appearance
            </span>
            <NavThemeToggle />
          </div>

          <div className="site-mobile-menu__divider" aria-hidden />

          <div className="site-mobile-menu__account">
            <p className="mb-2 font-ui text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
              Account
            </p>
            {user ? (
              <div className="flex flex-col gap-1">
                <p className="mb-2 truncate font-ui text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">{user.email}</p>
                <NavLink to="/profile" className={subLinkClass} onClick={close}>
                  <UserRound className="h-5 w-5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                  Profile
                </NavLink>
                {showAdmin ? (
                  <NavLink to="/admin" className={subLinkClass} onClick={close}>
                    <LayoutDashboard className="h-5 w-5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                    Staff hub
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  className={`${subLinkClass} text-left`}
                  onClick={() => {
                    close();
                    void logout();
                  }}
                >
                  <LogOut className="h-5 w-5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <NavLink to="/sign-in" className={subLinkClass} onClick={close}>
                  {loading ? "…" : "Sign in"}
                </NavLink>
                <NavLink to="/register" className={subLinkClass} onClick={close}>
                  Create account
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
