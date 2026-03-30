import { Link } from "react-router-dom";

const shellPt = "pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]";

export default function PrivacyPage() {
  return (
    <div className={`mx-auto w-full max-w-3xl px-4 pb-20 ${shellPt} md:px-6 lg:px-8`}>
      <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
        <Link to="/" className="font-medium text-[color:var(--ink)] hover:underline">
          Home
        </Link>
        <span className="mx-2 text-[color:color-mix(in_srgb,var(--ink)_35%,transparent)]">/</span>
        <span className="text-[color:var(--ink)]">Privacy</span>
      </p>

      <h1 className="font-ui-medium mt-6 text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">Privacy policy</h1>
      <p className="mt-3 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_62%,transparent)]">
        Demo policy for the Roxy storefront preview. This is not legal advice and does not create obligations for a production
        service.
      </p>
      <p className="mt-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">Last updated March 2026</p>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_88%,transparent)]">
        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Overview</h2>
          <p className="mt-3">
            Roxy (&quot;we&quot;, &quot;us&quot;) respects your privacy. This page describes what information this demo site may
            process and how it is used in a typical browsing session.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Information we collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[color:var(--ink)]">Device and usage data:</strong> browser type, approximate region from
              IP (if server logs exist in a real deployment), and pages viewed.
            </li>
            <li>
              <strong className="text-[color:var(--ink)]">Account details:</strong> if you register or sign in, email and profile
              fields you provide. This demo may not persist real accounts.
            </li>
            <li>
              <strong className="text-[color:var(--ink)]">Cart and preferences:</strong> items you add to cart and theme choice
              may be stored locally in your browser (for example via localStorage) to improve the experience.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">How we use information</h2>
          <p className="mt-3">
            We use data to operate the site, process orders in a live product, prevent fraud, improve performance, and communicate
            with you about your account or purchases. In this demo build, many flows are simulated.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Cookies and similar technologies</h2>
          <p className="mt-3">
            We may use cookies or local storage for session state, cart contents, and preferences (such as light or dark mode).
            You can clear site data in your browser settings at any time.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Sharing</h2>
          <p className="mt-3">
            We do not sell your personal information. We may share data with service providers (hosting, analytics, payment
            processors) who assist in operating a production store, subject to contracts and law.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Your choices</h2>
          <p className="mt-3">
            Where applicable, you may access, correct, or delete personal data, or opt out of certain marketing. Contact us using
            the details on the site once a production support channel exists.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Contact</h2>
          <p className="mt-3">
            Questions about this policy? See{" "}
            <Link to="/terms" className="font-semibold text-[color:var(--ink)] underline-offset-2 hover:underline">
              Terms of use
            </Link>{" "}
            or reach out through your official Roxy support channel when available.
          </p>
        </section>
      </div>
    </div>
  );
}
