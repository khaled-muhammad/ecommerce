import BorderGlow from "./BorderGlow.jsx";
import { apiUrl } from "../lib/apiUrl.js";
import "./GoogleOAuthBorderButton.css";

function GoogleMark({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * @param {{ mode?: 'sign-in' | 'sign-up'; redirectTo?: string }} props
 */
export default function GoogleOAuthBorderButton({ mode = "sign-in", redirectTo = "/" }) {
  const q = new URLSearchParams();
  q.set("redirect", redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`);
  q.set("mode", mode === "sign-up" ? "sign-up" : "sign-in");
  const href = apiUrl(`/api/v1/auth/google?${q.toString()}`);

  const title = mode === "sign-up" ? "Sign up with Google" : "Continue with Google";
  const subtitle =
    mode === "sign-up"
      ? "New here — we’ll create your account"
      : "Sign in or create an account";

  return (
    <BorderGlow
      className="auth-google-border-glow"
      borderRadius={999}
      glowRadius={32}
      edgeSensitivity={24}
      glowColor="217 70 72"
      backgroundColor="color-mix(in srgb, var(--vexo-card, #1e293b) 82%, #000 18%)"
      colors={["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#a78bfa", "#38bdf8"]}
      fillOpacity={0.42}
      glowIntensity={1.05}
      coneSpread={22}
    >
      <a href={href} className="auth-google-border-glow__link" draggable={false}>
        <GoogleMark className="shrink-0" />
        <span className="auth-google-border-glow__text">
          <span className="auth-google-border-glow__title">{title}</span>
          <span className="auth-google-border-glow__sub">{subtitle}</span>
        </span>
      </a>
    </BorderGlow>
  );
}
