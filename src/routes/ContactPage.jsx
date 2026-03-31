import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AuthGlassSurface from "./AuthGlassSurface.jsx";
import AuthPageShell, { AUTH_FORM_GLASS_PROPS } from "./AuthPageShell.jsx";
import { apiUrl } from "../lib/apiUrl.js";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/v1/site/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        /* ignore */
      }
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Could not send message");
      toast.success("Thanks, we'll get back to you soon.");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
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
        className="glass-surface--soft-inset w-full max-w-[480px] [&_.glass-surface__content]:!items-stretch [&_.glass-surface__content]:!justify-start [&_.glass-surface__content]:!p-0"
        style={{ maxWidth: 480 }}
      >
        <div className="flex w-full flex-col gap-6 p-7 sm:p-8">
          <div>
            <h1 className="font-ui text-2xl font-bold tracking-tight text-[color:var(--vexo-text)]">Contact us</h1>
            <p className="mt-1 font-ui text-sm text-[color:var(--vexo-text-secondary)]">
              Questions about an order, a build, or partnering with Roxy? Send a note and we&apos;ll reply by email.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">Name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className="font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--vexo-text)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--vexo-text)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--vexo-text)] outline-none placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-text)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--vexo-text)_22%,transparent)]"
                placeholder="Your name"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={320}
                className="font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--vexo-text)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--vexo-text)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--vexo-text)] outline-none placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-text)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--vexo-text)_22%,transparent)]"
                placeholder="you@example.com"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[color:var(--vexo-text-muted)]">Message</span>
              <textarea
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                maxLength={8000}
                className="font-ui min-h-[120px] w-full resize-y rounded-xl border border-[color:color-mix(in_srgb,var(--vexo-text)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--vexo-text)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--vexo-text)] outline-none placeholder:text-[color:var(--vexo-text-muted)] focus:border-[color:color-mix(in_srgb,var(--vexo-text)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--vexo-text)_22%,transparent)]"
                placeholder="How can we help?"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="font-ui mt-1 inline-flex w-full items-center justify-center rounded-full bg-[color:var(--vexo-btn-primary-bg)] py-3.5 text-sm font-semibold text-[color:var(--vexo-btn-primary-fg)] shadow-lg transition-[transform,opacity] hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>

          <p className="text-center font-ui text-[11px] leading-relaxed text-[color:var(--vexo-text-muted)]">
            Prefer self-serve? Visit{" "}
            <Link to="/support" className="font-medium text-[color:var(--vexo-text-secondary)] underline-offset-2 hover:underline">
              Support
            </Link>
            .
          </p>
        </div>
      </AuthGlassSurface>
    </AuthPageShell>
  );
}
