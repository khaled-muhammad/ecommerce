/** “Or continue with email” separator between OAuth and password fields */
export default function AuthEmailDivider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-[color:color-mix(in_srgb,var(--vexo-divider)_80%,transparent)]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[color:color-mix(in_srgb,var(--vexo-card)_92%,transparent)] px-3 font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--vexo-text-muted)]">
          Or with email
        </span>
      </div>
    </div>
  );
}
