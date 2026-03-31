import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AuthGlassSurface from "./AuthGlassSurface.jsx";
import GoogleOAuthBorderButton from "../components/GoogleOAuthBorderButton.jsx";
import AuthPageShell, { AUTH_FORM_GLASS_PROPS } from "./AuthPageShell.jsx";
import AuthEmailDivider from "./AuthEmailDivider.jsx";
import { useAuth } from "../auth/useAuth.js";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname ?? "/";

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Signed in");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell>
      <AuthGlassSurface
        {...AUTH_FORM_GLASS_PROPS}
        borderRadius={24}
        width="100%"
        height="auto"
        borderWidth={0.065}
        className="glass-surface--soft-inset w-full max-w-[420px] [&_.glass-surface__content]:!items-stretch [&_.glass-surface__content]:!justify-start [&_.glass-surface__content]:!p-0"
        style={{ maxWidth: 420 }}
      >
        <form className="flex w-full flex-col gap-6 p-7 sm:p-8" onSubmit={onSubmit}>
          <div>
            <h1 className="font-ui text-2xl font-bold tracking-tight text-[color:var(--vexo-text)]">Welcome back</h1>
            <p className="mt-1 font-ui text-sm text-[color:var(--vexo-text-secondary)]">
              Sign in to manage carts, orders, and saved builds.
            </p>
          </div>

          <GoogleOAuthBorderButton mode="sign-in" redirectTo={from} />

          <p className="text-center font-ui text-[11px] leading-relaxed text-[color:var(--vexo-text-muted)]">
            Google signs you in or creates an account. By continuing you agree to our{" "}
            <Link to="/terms" className="font-medium text-[color:var(--vexo-text-secondary)] underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-medium text-[color:var(--vexo-text-secondary)] underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <AuthEmailDivider />

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">
                Email
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-ui w-full rounded-xl border border-[color:var(--vexo-divider)] bg-[color:color-mix(in_srgb,var(--vexo-card)_72%,transparent)] px-3.5 py-3 text-sm text-[color:var(--vexo-text)] outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-dark)_55%,transparent)] focus:ring-2 focus:ring-[color:var(--vexo-focus-ring)]"
                placeholder="you@example.com"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">
                Password
              </span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-ui w-full rounded-xl border border-[color:var(--vexo-divider)] bg-[color:color-mix(in_srgb,var(--vexo-card)_72%,transparent)] px-3.5 py-3 text-sm text-[color:var(--vexo-text)] outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-dark)_55%,transparent)] focus:ring-2 focus:ring-[color:var(--vexo-focus-ring)]"
                placeholder="••••••••"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 font-ui text-xs text-[color:var(--vexo-text-secondary)]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-[color:var(--vexo-divider)] accent-[color:var(--vexo-dark)]"
              />
              Remember me
            </label>
            <span className="font-ui text-xs text-[color:var(--vexo-text-muted)]">Forgot password? Contact support.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="font-ui w-full rounded-full bg-[color:var(--vexo-btn-primary-bg)] py-3.5 text-sm font-semibold text-[color:var(--vexo-btn-primary-fg)] shadow-lg transition-[transform,box-shadow] hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center font-ui text-xs text-[color:var(--vexo-text-secondary)]">
            <Link to="/register" className="font-medium text-[color:var(--vexo-text)] underline-offset-4 hover:underline">
              Create an account
            </Link>
            {" · "}
            <Link to="/shop" className="font-medium text-[color:var(--vexo-text)] underline-offset-4 hover:underline">
              Browse the shop
            </Link>
          </p>
        </form>
      </AuthGlassSurface>
    </AuthPageShell>
  );
}
