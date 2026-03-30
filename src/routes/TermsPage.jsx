import { Link } from "react-router-dom";

const shellPt = "pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]";

export default function TermsPage() {
  return (
    <div className={`mx-auto w-full max-w-3xl px-4 pb-20 ${shellPt} md:px-6 lg:px-8`}>
      <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">
        <Link to="/" className="font-medium text-[color:var(--ink)] hover:underline">
          Home
        </Link>
        <span className="mx-2 text-[color:color-mix(in_srgb,var(--ink)_35%,transparent)]">/</span>
        <span className="text-[color:var(--ink)]">Terms</span>
      </p>

      <h1 className="font-ui-medium mt-6 text-3xl tracking-[-0.03em] text-[color:var(--ink)] md:text-4xl">Terms of use</h1>
      <p className="mt-3 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_62%,transparent)]">
        These terms apply to the Roxy demo storefront. They are sample text for development and design review, not a binding
        legal agreement unless published and accepted in a real product.
      </p>
      <p className="mt-2 text-xs text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">Last updated March 2026</p>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_88%,transparent)]">
        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Agreement</h2>
          <p className="mt-3">
            By accessing this site you agree to these terms and our{" "}
            <Link to="/privacy" className="font-semibold text-[color:var(--ink)] underline-offset-2 hover:underline">
              Privacy policy
            </Link>
            . If you do not agree, do not use the site.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Demo nature</h2>
          <p className="mt-3">
            Listings, prices, inventory, and checkout may be simulated. No real payment is processed unless explicitly connected
            to a live payment provider. Do not rely on this environment for commercial decisions.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Products and specifications</h2>
          <p className="mt-3">
            Product images, specifications, and compatibility information are provided for illustration. In production, always
            verify model numbers, warranties, and regulatory compliance with the manufacturer before purchase.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Orders and payment</h2>
          <p className="mt-3">
            When checkout is live, placing an order may constitute an offer to purchase. We reserve the right to refuse or cancel
            orders, limit quantities, and correct pricing errors. Taxes and shipping are estimated until finalized at checkout.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Intellectual property</h2>
          <p className="mt-3">
            Roxy branding, site design, and original content are owned by Roxy or its licensors. Third-party trademarks belong to
            their respective owners.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Disclaimer</h2>
          <p className="mt-3">
            The site is provided &quot;as is&quot; without warranties of any kind. To the fullest extent permitted by law, Roxy is
            not liable for indirect or consequential damages arising from use of this demo.
          </p>
        </section>

        <section>
          <h2 className="font-ui-medium text-lg text-[color:var(--ink)]">Changes</h2>
          <p className="mt-3">
            We may update these terms. Continued use after changes constitutes acceptance of the revised terms where required by
            law.
          </p>
        </section>
      </div>
    </div>
  );
}
