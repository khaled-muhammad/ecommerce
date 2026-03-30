import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassSurface from "../components/GlassSurface.jsx";
import AuthPageShell, { AUTH_FORM_GLASS_PROPS } from "./AuthPageShell.jsx";
import { useAuth } from "../auth/useAuth.js";

const STAFF_ROLES = new Set(["owner", "admin"]);

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (!STAFF_ROLES.has(user.role)) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user || !STAFF_ROLES.has(user.role)) {
    return (
      <AuthPageShell>
        <div className="flex min-h-[50vh] items-center justify-center font-ui text-sm text-[color:var(--vexo-text-secondary)]">
          Loading…
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <GlassSurface
        {...AUTH_FORM_GLASS_PROPS}
        borderRadius={24}
        width="100%"
        height="auto"
        borderWidth={0.065}
        className="glass-surface--soft-inset w-full max-w-[480px] [&_.glass-surface__content]:!items-stretch [&_.glass-surface__content]:!justify-start [&_.glass-surface__content]:!p-0"
        style={{ maxWidth: 480 }}
      >
        <div className="flex w-full flex-col gap-6 p-7 sm:p-8">
          <div>
            <p className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">
              Store owner setup
            </p>
            <h1 className="mt-2 font-ui text-2xl font-bold tracking-tight text-[color:var(--vexo-text)]">
              You are the administrator
            </h1>
            <p className="mt-2 font-ui text-sm leading-relaxed text-[color:var(--vexo-text-secondary)]">
              This is the first account with full access. Your role is <span className="font-medium text-[color:var(--vexo-text)]">{user.role}</span>
              . You can manage staff, orders, and catalog through the backend and staff APIs when you connect your admin tools.
            </p>
          </div>

          <ul className="list-inside list-disc space-y-2 font-ui text-sm text-[color:var(--vexo-text-secondary)]">
            <li>Keep this account secure — it can grant access to others.</li>
            <li>Invite additional admins from staff management when your tooling is wired up.</li>
            <li>Customers who register later will have the default shopper role only.</li>
          </ul>

          <Link
            to="/"
            className="font-ui inline-flex w-full items-center justify-center rounded-full bg-[color:var(--vexo-btn-primary-bg)] py-3.5 text-center text-sm font-semibold text-[color:var(--vexo-btn-primary-fg)] shadow-lg transition-[transform,box-shadow] hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
          >
            Continue to store
          </Link>

          <p className="text-center font-ui text-xs text-[color:var(--vexo-text-muted)]">
            <Link to="/profile" className="font-medium text-[color:var(--vexo-text-secondary)] underline-offset-4 hover:underline">
              View your profile
            </Link>
          </p>
        </div>
      </GlassSurface>
    </AuthPageShell>
  );
}
