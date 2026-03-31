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
  const baseLink =
    variant === "secondary"
      ? [
          "font-ui inline-flex min-h-[3rem] w-auto max-w-full items-center justify-center gap-2 rounded-full",
          "px-8 py-3.5 sm:px-10 sm:py-4",
          "text-sm font-semibold leading-tight tracking-tight",
          "bg-transparent text-[color:var(--vexo-btn-secondary-fg)] no-underline",
          "transition-[transform,color] duration-200 hover:scale-[1.02] active:scale-[0.99]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--vexo-focus-ring)]",
        ].join(" ")
      : [
          "font-ui inline-flex min-h-[3rem] w-auto max-w-full items-center justify-center gap-2 rounded-full",
          "px-8 py-3.5 sm:px-10 sm:py-4",
          "text-sm font-semibold leading-tight tracking-tight",
          "bg-transparent text-[color:var(--vexo-btn-primary-fg)] no-underline",
          "transition-[transform,color] duration-200 hover:scale-[1.02] active:scale-[0.99]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--vexo-focus-ring)]",
        ].join(" ");
  const linkClass = [baseLink, linkClassName, linkClassFromSpread].filter(Boolean).join(" ");

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
