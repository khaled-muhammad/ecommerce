/**
 * Landing panel for staff roles that do not yet have dedicated tools in the SPA,
 * or optional context for any role (extend as needed).
 */

const ROLE_COPY = {
  fulfillment: {
    title: "Fulfillment",
    summary: "Pack, ship, and update order status.",
    detail:
      "Use the Orders tab in the staff hub to list every order, filter by status, advance fulfillment (paid → processing → shipped → delivered), cancel when appropriate, and add internal notes. Refunds are handled by admin, manager, and support via Stripe on that same tab.",
  },
  content_editor: {
    title: "Content editor",
    summary: "Product copy, media, and merchandising content.",
    detail:
      "Catalog create/edit in this app is limited to owner and admin today. Your role is recognized; dedicated editor views (partial catalog, drafts) can be unlocked when matching API routes and permissions are added.",
  },
};

export default function StaffRoleOverview({ role }) {
  const copy = ROLE_COPY[role] ?? {
    title: role?.replace(/_/g, " ") ?? "Staff",
    summary: "Team access",
    detail: "No extra tools are exposed for this role in the admin UI yet.",
  };

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_42%,transparent)]">Your role</p>
        <h2 className="mt-2 font-ui text-xl font-bold tracking-tight capitalize text-[color:var(--ink)]">{copy.title}</h2>
        <p className="mt-2 text-sm font-medium text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">{copy.summary}</p>
        <p className="mt-4 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">{copy.detail}</p>
      </div>
      <div className="rounded-2xl border border-dashed border-[color:color-mix(in_srgb,var(--ink)_16%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_2%,transparent)] p-5 text-sm text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">
        <p className="font-medium text-[color:var(--ink)]">What is available today</p>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>
            <strong className="text-[color:var(--ink)]">Store owner</strong> - full staff hub (every delegated role’s tools in this app)
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Admin</strong> - staff, catalog, customers, promotions, analytics
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Manager</strong> - customers, promotions, analytics
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Support</strong> - customer lookup
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Analyst</strong> - analytics only
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Fulfillment</strong> - Orders tab (pipeline + notes); content tools when added
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Content editor</strong> - this overview until scoped catalog APIs exist
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Customer</strong> - no staff hub (shopper account only)
          </li>
        </ul>
      </div>
    </div>
  );
}
