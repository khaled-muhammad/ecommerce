import { Outlet, useLocation } from "react-router-dom";
import AuthBootstrapScreen from "../components/AuthBootstrapScreen.jsx";
import SiteShellSprite from "../components/site-shell/SiteShellSprite.jsx";
import SiteShellSafeArea from "../components/site-shell/SiteShellSafeArea.jsx";
import SiteShellNav from "../components/site-shell/SiteShellNav.jsx";
import { useAuth } from "../auth/useAuth.js";
import LaserFooterRevealSection from "./LaserFooterRevealSection.jsx";
import SideCart from "../cart/SideCart.jsx";
import "./site-shell.css";

const shellStyle = { minHeight: "100vh", width: "auto" };
const canvasStyle = { minHeight: "100vh", width: "auto", display: "contents" };
const heroFill = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  background:
    "linear-gradient(var(--vexo-shell-grad-start), var(--vexo-shell-grad-end))",
};

export default function MainLayout() {
  const { loading } = useAuth();
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const isAuthPage =
    pathname === "/sign-in" ||
    pathname === "/register" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/support";
  const isAdminHub = pathname === "/admin" || pathname.startsWith("/admin/");
  const hidePageTail = isLanding || isAuthPage;

  if (loading) {
    return (
      <div className="site-root-vars min-h-full">
        <AuthBootstrapScreen />
      </div>
    );
  }

  return (
    <>
      <div className="site-root-vars min-h-full">
        <SiteShellSprite />
        <div
          className={["site-shell", "site-shell-layout", isAdminHub ? "site-shell-layout--admin-wide" : ""].filter(Boolean).join(" ")}
          style={shellStyle}
        >
          <div
            className="site-canvas site-canvas-width"
            style={canvasStyle}
          >
            <div
              className={`site-hero${hidePageTail ? "" : " site-hero--with-page-tail"}`}
            >
              <div className="site-hero-viewport">
                <div className="site-hero-bg">
                  <div className="hero-bg-fill" style={heroFill} aria-hidden />
                </div>
                <div className="site-hero-outlet">
                  {hidePageTail ? (
                    <Outlet />
                  ) : (
                    <div className="site-outlet-body">
                      <Outlet />
                    </div>
                  )}
                </div>
              </div>
              {hidePageTail ? null : (
                <div className="site-page-tail">
                  <LaserFooterRevealSection />
                </div>
              )}
            </div>
          </div>

          <SiteShellSafeArea />
          <SiteShellNav />
          <SideCart />
        </div>
      </div>
    </>
  );
}
