import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AuthGlassSurface from "./AuthGlassSurface.jsx";
import GoogleOAuthBorderButton from "../components/GoogleOAuthBorderButton.jsx";
import AuthPageShell, { AUTH_FORM_GLASS_PROPS } from "./AuthPageShell.jsx";
import AuthEmailDivider from "./AuthEmailDivider.jsx";
import { useAuth } from "../auth/useAuth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the terms to continue");
      return;
    }
    setSubmitting(true);
    try {
      const { adminBootstrap } = await register({ email: email.trim(), password, name: name.trim() });
      toast.success(adminBootstrap ? "You are the store owner - finish setup below." : "Account created");
      navigate(adminBootstrap ? "/admin/setup" : "/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
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
            <h1 className="font-ui text-2xl font-bold tracking-tight text-[color:var(--vexo-text)]">Create an account</h1>
            <p className="mt-1 font-ui text-sm text-[color:var(--vexo-text-secondary)]">
              Join to save builds, track orders, and check out faster.
            </p>
          </div>

          <GoogleOAuthBorderButton mode="sign-up" redirectTo="/" />

          <p className="text-center font-ui text-[11px] leading-relaxed text-[color:var(--vexo-text-muted)]">
            By using Google you agree to our{" "}
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
                Name <span className="font-normal normal-case text-[color:var(--vexo-text-muted)]">(optional)</span>
              </span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-ui w-full rounded-xl border border-[color:var(--vexo-divider)] bg-[color:color-mix(in_srgb,var(--vexo-card)_72%,transparent)] px-3.5 py-3 text-sm text-[color:var(--vexo-text)] outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-dark)_55%,transparent)] focus:ring-2 focus:ring-[color:var(--vexo-focus-ring)]"
                placeholder="Ada Lovelace"
              />
            </label>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="font-ui w-full rounded-xl border border-[color:var(--vexo-divider)] bg-[color:color-mix(in_srgb,var(--vexo-card)_72%,transparent)] px-3.5 py-3 text-sm text-[color:var(--vexo-text)] outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-dark)_55%,transparent)] focus:ring-2 focus:ring-[color:var(--vexo-focus-ring)]"
                placeholder="••••••••"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">
                Confirm password
              </span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="font-ui w-full rounded-xl border border-[color:var(--vexo-divider)] bg-[color:color-mix(in_srgb,var(--vexo-card)_72%,transparent)] px-3.5 py-3 text-sm text-[color:var(--vexo-text)] outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-dark)_55%,transparent)] focus:ring-2 focus:ring-[color:var(--vexo-focus-ring)]"
                placeholder="••••••••"
              />
            </label>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 font-ui text-xs text-[color:var(--vexo-text-secondary)]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[color:var(--vexo-divider)] accent-[color:var(--vexo-dark)]"
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="font-medium text-[color:var(--vexo-text)] underline-offset-4 hover:underline">
                terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="font-medium text-[color:var(--vexo-text)] underline-offset-4 hover:underline">
                privacy policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="font-ui w-full rounded-full bg-[color:var(--vexo-btn-primary-bg)] py-3.5 text-sm font-semibold text-[color:var(--vexo-btn-primary-fg)] shadow-lg transition-[transform,box-shadow] hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center font-ui text-xs text-[color:var(--vexo-text-secondary)]">
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="font-medium text-[color:var(--vexo-text)] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </AuthGlassSurface>
    </AuthPageShell>
  );
}
