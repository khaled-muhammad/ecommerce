import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Moon, ShoppingCart, Sun } from "lucide-react";
import { useTheme } from "../../theme/useTheme.js";
import { useCart } from "../../cart/useCart.js";
import { useAuth } from "../../auth/useAuth.js";
import NavShopSearch from "./NavShopSearch.jsx";
import NavAccountMenu from "./NavAccountMenu.jsx";

const SCROLL_TOP_REVEAL = 56;
const SCROLL_DELTA = 6;

const navBarStyle = {
  width: "100%",
};

const pillStyle = { background: "transparent", borderRadius: 12 };

const PRIMARY_LINKS = [
  { to: "/categories", label: "Categories", linkClass: "site-nav-link-categories" },
  { to: "/brands", label: "Brands", linkClass: "site-nav-link-brands" },
];

function NavCorner({ side }) {
  const isLeft = side === "left";
  return (
    <div
      className={isLeft ? "site-top-nav-corner-l" : "site-top-nav-corner-r"}
      style={{ transform: isLeft ? "rotate(-180deg)" : "rotate(-270deg)" }}
    >
      <div
        className={
          isLeft ? "site-top-nav-corner-l-svg embed-abs" : "site-top-nav-corner-r-svg embed-abs"
        }
        style={{ imageRendering: "pixelated", flexShrink: 0 }}
        aria-hidden
      >
        <div
          className="svg-container"
          style={{ width: "100%", height: "100%", aspectRatio: "inherit" }}
        >
          <svg style={{ width: "100%", height: "100%" }}>
            <use href={isLeft ? "#def-nav-corner-l" : "#def-nav-corner-r"} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function NavPill({ to, className = "", children, end = false, ...rest }) {
  const inner = (
    <div className="site-menu-trigger site-menu-trigger-cell" style={pillStyle}>
      <div className="site-menu-trigger-text text-stack">
        <p className="nav-label">{children}</p>
      </div>
    </div>
  );

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [className, isActive ? "site-nav-link--active" : ""].filter(Boolean).join(" ").trim()
      }
      style={{ borderRadius: 12 }}
      {...rest}
    >
      {inner}
    </NavLink>
  );
}

function NavPrimaryLinks() {
  return (
    <div className="site-nav-links">
      <NavPill to="/shop" className="site-nav-item-shop site-top-nav-a">
        Shop
      </NavPill>

      {PRIMARY_LINKS.map(({ to, label, linkClass }) => (
        <NavPill key={to} to={to} className={`${linkClass} site-top-nav-a`}>
          {label}
        </NavPill>
      ))}
    </div>
  );
}

function NavBrand() {
  return (
    <NavLink
      className={({ isActive }) =>
        `site-top-nav-brand site-top-nav-a${isActive ? " site-nav-link--active" : ""}`.trim()
      }
      to="/"
      end
      aria-label="Roxy home"
    >
      <span className="site-roxy-wordmark">Roxy</span>
    </NavLink>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="site-theme-toggle"
      onClick={toggleTheme}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      aria-pressed={dark}
    >
      {dark ? <Sun className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden /> : <Moon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />}
    </button>
  );
}

function NavActions() {
  const { itemCount } = useCart();
  const { user, loading } = useAuth();
  const badge =
    itemCount > 0 ? (
      <span className="site-nav-cart-badge" aria-hidden>
        {itemCount > 99 ? "99+" : itemCount}
      </span>
    ) : null;

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Account";

  return (
    <div className="site-nav-aside">
      <ThemeToggle />
      {user ? (
        <NavAccountMenu displayName={displayName} email={user.email} />
      ) : (
        <>
          <NavPill to="/sign-in" end className="site-nav-signin site-top-nav-a">
            {loading ? "…" : "Sign in"}
          </NavPill>
          <NavPill to="/register" end className="site-nav-signin site-top-nav-a">
            Register
          </NavPill>
        </>
      )}

      <NavLink
        to="/cart"
        end
        aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
        className={({ isActive }) =>
          `site-nav-cart-trigger site-top-nav-a${isActive ? " site-nav-link--active" : ""}`.trim()
        }
      >
        <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        {badge}
      </NavLink>
    </div>
  );
}

export default function SiteShellNav() {
  const [scrollHidden, setScrollHidden] = useState(false);
  const lastY = useRef(0);
  const frame = useRef(0);
  const navRef = useRef(null);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;
        lastY.current = y;

        if (y <= SCROLL_TOP_REVEAL) {
          setScrollHidden(false);
          return;
        }
        if (delta > SCROLL_DELTA) setScrollHidden(true);
        else if (delta < -SCROLL_DELTA) setScrollHidden(false);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      className={`site-nav-dock${scrollHidden ? " site-nav-dock--scroll-hidden" : ""}`}
      inert={scrollHidden ? true : undefined}
    >
      <nav
        ref={navRef}
        className="site-top-nav site-top-nav-bar"
        style={navBarStyle}
        aria-label="Main"
      >
        <div className="site-top-nav-bg" aria-hidden />

        <div className="site-top-nav-inner">
          <div className="site-top-nav-start">
            <NavPrimaryLinks />
          </div>
            <NavBrand />
          <div className="site-top-nav-end">
            <NavShopSearch navRef={navRef} />
            <NavActions />
          </div>
        </div>

        <NavCorner side="left" />
        <NavCorner side="right" />
      </nav>
    </div>
  );
}
