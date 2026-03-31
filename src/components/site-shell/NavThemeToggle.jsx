import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/useTheme.js";

export default function NavThemeToggle() {
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
