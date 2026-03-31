/**
 * Full-viewport session bootstrap UI (auth resolving). Uses theme tokens from :root.
 */
export default function AuthBootstrapScreen() {
  return (
    <div
      className="flex min-h-[100dvh] min-h-[100svh] w-full flex-col items-center justify-center gap-4 bg-[color:var(--vexo-shell-grad-end)] font-ui dark:bg-[#06060f]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading session"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[color:var(--vexo-text-muted)] border-t-[color:var(--vexo-text)]"
        aria-hidden
      />
      <p className="text-sm text-[color:var(--vexo-text-secondary)]">Loading…</p>
    </div>
  );
}
