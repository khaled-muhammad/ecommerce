import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Heart, LayoutDashboard, LogOut, Package, UserRound } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { hasStaffDashboardAccess } from "../../lib/staffCapabilities.js";

const pillStyle = { background: "transparent", borderRadius: 12 };

export default function NavAccountMenu({ displayName, email }) {
  const { logout, user } = useAuth();
  const showAdmin = hasStaffDashboardAccess(user?.role);
  const [open, setOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const wrapRef = useRef(null);
  const closeTimer = useRef(0);

  const prefersHover =
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const visible = open || hoverOpen;

  const scheduleClose = useCallback(() => {
    if (!prefersHover) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHoverOpen(false), 140);
  }, [prefersHover]);

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div
      ref={wrapRef}
      className="relative z-[20]"
      onMouseEnter={() => {
        cancelClose();
        if (prefersHover) setHoverOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="site-top-nav-a site-nav-account-trigger flex max-w-[160px] items-center rounded-[12px] outline-none transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--ink)_35%,transparent)] sm:max-w-[200px]"
        style={pillStyle}
        aria-expanded={visible}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        title={email}
      >
        <div className="site-menu-trigger site-menu-trigger-cell w-full min-w-0 px-1">
          <div className="site-menu-trigger-text text-stack">
            <p className="nav-label max-w-full truncate">{displayName}</p>
          </div>
        </div>
      </button>

      <div
        role="menu"
        aria-hidden={!visible}
        className={[
          "absolute right-0 top-[calc(100%+6px)] min-w-[11.5rem] origin-top-right rounded-2xl border py-1 shadow-xl transition-[opacity,transform,visibility] duration-150",
          "border-[color:color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color:var(--paper)] text-[color:var(--ink)]",
          "dark:border-[color:color-mix(in_srgb,var(--ink)_22%,transparent)]",
          visible ? "visible scale-100 opacity-100 overflow-hidden" : "invisible scale-[0.98] opacity-0 pointer-events-none",
        ].join(" ")}
        onMouseEnter={() => {
          cancelClose();
          if (prefersHover) setHoverOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        <NavLink
          to="/profile"
          role="menuitem"
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
          onClick={() => setOpen(false)}
        >
          <UserRound className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Profile
        </NavLink>
        <NavLink
          to="/orders"
          role="menuitem"
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
          onClick={() => setOpen(false)}
        >
          <Package className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Orders
        </NavLink>
        <NavLink
          to="/favorites"
          role="menuitem"
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
          onClick={() => setOpen(false)}
        >
          <Heart className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Favorites
        </NavLink>
        {showAdmin ? (
          <NavLink
            to="/admin"
            role="menuitem"
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
            Staff hub
          </NavLink>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
          onClick={() => {
            setOpen(false);
            void logout();
          }}
        >
          <LogOut className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Log out
        </button>
      </div>
    </div>
  );
}
