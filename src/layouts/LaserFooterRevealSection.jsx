import SiteFooter from "./SiteFooter.jsx";
import LaserFlow from "../components/LaserFlow.jsx";
import { useTheme } from "../theme/useTheme.js";

/** Same laser + footer card as the landing page `LaserRevealSection` — single source of truth. */
export default function LaserFooterRevealSection() {
  const { isDark } = useTheme();
  const laserColor = isDark ? "#CF9EFF" : "#7c3aed";

  return (
    <section
      className="laser-reveal-section scroll-reveal relative w-full overflow-hidden"
      style={{ height: "clamp(320px, 55vw, 840px)" }}
      aria-hidden
    >
      <LaserFlow
        transparentBackground
        horizontalBeamOffset={0.1}
        verticalBeamOffset={0}
        horizontalSizing={0.5}
        verticalSizing={2}
        wispDensity={1}
        wispSpeed={15}
        wispIntensity={5}
        flowSpeed={0.35}
        flowStrength={0.25}
        fogIntensity={0.45}
        fogScale={0.3}
        fogFallSpeed={0.6}
        decay={1.1}
        falloffStart={1.2}
        color={laserColor}
      />
      <LaserFlow
        horizontalBeamOffset={0.1}
        verticalBeamOffset={0.0}
        color="#CF9EFF"
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "86%",
          height: "45%",
          backgroundColor: "var(--vexo-elevated)",
          borderRadius: "20px",
          border: "2px solid var(--vexo-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "2rem",
          zIndex: 6,
        }}
      >
        <SiteFooter />
      </div>
    </section>
  );
}
