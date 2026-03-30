import { Link } from "react-router-dom";
import BorderGlow from "./BorderGlow.jsx";

const PRIMARY = {
  backgroundColor: "var(--vexo-btn-primary-bg)",
  glowColor: "172 48% 52%",
  colors: ["#5eead4", "#7dd3fc", "#c4b5fd"],
};

const SECONDARY = {
  backgroundColor: "color-mix(in srgb, var(--vexo-bg) 86%, var(--vexo-btn-secondary-border) 14%)",
  glowColor: "195 38% 48%",
  colors: ["#94a3b8", "#5eead4", "#a5b4fc"],
};

export default function GlowingMainLink({
  to,
  variant = "primary",
  className = "",
  linkClassName = "",
  children,
  ...linkProps
}) {
  const preset = variant === "secondary" ? SECONDARY : PRIMARY;
  const { className: linkClassFromSpread = "", ...rest } = linkProps;
  const btn =
    variant === "secondary"
      ? "btn-secondary btn-secondary--glow"
      : "btn-primary btn-primary--glow";
  const linkClass = [
    btn,
    "inline-flex",
    "items-center",
    "justify-center",
    "no-underline",
    linkClassName,
    linkClassFromSpread,
  ]
    .filter(Boolean)
    .join(" ");

  const shellClass = [
    "border-glow-card--pill",
    "hero-btn",
    variant === "primary" ? "border-glow-card--primary-fill" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BorderGlow
      className={shellClass}
      edgeSensitivity={28}
      glowColor={preset.glowColor}
      backgroundColor={preset.backgroundColor}
      borderRadius={9999}
      glowRadius={32}
      glowIntensity={0.85}
      coneSpread={22}
      animated={false}
      colors={preset.colors}
      fillOpacity={0.38}
    >
      <Link to={to} className={linkClass} {...rest}>
        {children}
      </Link>
    </BorderGlow>
  );
}
