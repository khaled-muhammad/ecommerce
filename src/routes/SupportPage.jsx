import { Link } from "react-router-dom";
import AuthGlassSurface from "./AuthGlassSurface.jsx";
import AuthPageShell, { AUTH_FORM_GLASS_PROPS } from "./AuthPageShell.jsx";

export default function SupportPage() {
  return (
    <AuthPageShell>
      <AuthGlassSurface
        {...AUTH_FORM_GLASS_PROPS}
        borderRadius={24}
        width="100%"
        height="auto"
        borderWidth={0.065}
        className="glass-surface--soft-inset w-full max-w-[520px] [&_.glass-surface__content]:!items-stretch [&_.glass-surface__content]:!justify-start [&_.glass-surface__content]:!p-0"
        style={{ maxWidth: 520 }}
      >
        <div className="flex w-full flex-col gap-6 p-7 sm:p-8">
          <div>
            <h1 className="font-ui text-2xl font-bold tracking-tight text-[color:var(--vexo-text)]">Support</h1>
            <p className="mt-1 font-ui text-sm text-[color:var(--vexo-text-secondary)]">
              Help using the Roxy demo storefront: orders, accounts, and builds.
            </p>
          </div>

          <div className="space-y-5 font-ui text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--vexo-text)_88%,transparent)]">
            <section>
              <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">
                Orders &amp; shipping
              </h2>
              <p className="mt-2">
                Track status from your account after checkout. For changes or issues, reach out through{" "}
                <Link to="/contact" className="font-medium text-[color:var(--vexo-text)] underline-offset-2 hover:underline">
                  Contact
                </Link>
                {" "}with your order details.
              </p>
            </section>
            <section>
              <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">
                Account &amp; sign-in
              </h2>
              <p className="mt-2">
                Use{" "}
                <Link to="/sign-in" className="font-medium text-[color:var(--vexo-text)] underline-offset-2 hover:underline">
                  Sign in
                </Link>{" "}
                or{" "}
                <Link to="/register" className="font-medium text-[color:var(--vexo-text)] underline-offset-2 hover:underline">
                  Register
                </Link>{" "}
                to save carts and addresses. Google sign-in is available on the auth pages.
              </p>
            </section>
            <section>
              <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">
                Returns &amp; refunds
              </h2>
              <p className="mt-2">
                This is a demo environment. In production, your policy would live here. For now, use the contact form for any
                refund questions.
              </p>
            </section>
          </div>

          <Link
            to="/contact"
            className="font-ui inline-flex w-full items-center justify-center rounded-full bg-[color:var(--vexo-btn-primary-bg)] py-3.5 text-center text-sm font-semibold text-[color:var(--vexo-btn-primary-fg)] shadow-lg transition-[transform,box-shadow] hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
          >
            Contact us
          </Link>
        </div>
      </AuthGlassSurface>
    </AuthPageShell>
  );
}
