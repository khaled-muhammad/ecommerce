import { Link } from "react-router-dom";
import LightRays from "../components/LightRays.jsx";
import { useMobileShell, usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

export const AUTH_FORM_GLASS_PROPS = {
  displace: 0.22,
  distortionScale: -95,
  redOffset: 0,
  greenOffset: 8,
  blueOffset: 14,
  brightness: 78,
  opacity: 0.82,
  mixBlendMode: "normal",
  backgroundOpacity: 0.4,
  saturation: 1.06,
  blur: 14,
  backdropBlur: 6,
};

const AUTH_NAV_TOP_PAD =
  "pt-[max(7.25rem,calc(env(safe-area-inset-top,0px)+6rem))]";

/**
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @param {boolean} [props.scrollable] When true, content aligns from the top with padding so long pages (e.g. About) scroll naturally instead of being vertically centered.
 */
export default function AuthPageShell({ children, scrollable = false }) {
  const isMobileShell = useMobileShell();
  const reduceMotion = usePrefersReducedMotion();
  const showLightRays = !isMobileShell && !reduceMotion;

  const mainClass = [
    "relative z-[1] flex w-full flex-1 flex-col items-center px-4 pb-14 sm:pb-20",
    AUTH_NAV_TOP_PAD,
    scrollable
      ? "justify-start pb-6 sm:pb-10 md:pt-[max(9.25rem,calc(env(safe-area-inset-top,0px)+7.85rem))]"
      : "justify-center",
  ].join(" ");

  return (
    <div className="auth-page relative flex min-h-[100svh] min-h-[100dvh] w-full min-w-0 flex-1 flex-col">
      <div
        className="absolute inset-0 bg-[color:var(--vexo-shell-grad-end)] dark:bg-[#06060f]"
        aria-hidden
      />

      {showLightRays ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 h-full min-h-[min(100dvh,760px)] w-full">
            <LightRays
              raysOrigin="top-center"
              raysColor="#ffffff"
              raysSpeed={1}
              lightSpread={0.5}
              rayLength={3}
              followMouse={true}
              mouseInfluence={0.1}
              noiseAmount={0}
              distortion={0}
              className="custom-rays h-full w-full"
              pulsating={false}
              fadeDistance={1}
              saturation={1}
            />
          </div>
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/[0.07] via-transparent to-slate-800/10 dark:from-black/50 dark:via-transparent dark:to-black/55"
        aria-hidden
      />

      <div className={mainClass}>
        {children}
        <Link
          to="/"
          className="mt-8 font-ui text-xs font-medium text-[color:var(--vexo-text-secondary)] transition-colors hover:text-[color:var(--vexo-text)]"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
