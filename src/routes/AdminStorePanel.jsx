import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../auth/useAuth.js";
import { useSiteConfig } from "../context/useSiteConfig.js";
import { apiUrl } from "../lib/apiUrl.js";

const field =
  "font-ui w-full rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)] focus:border-[color:color-mix(in_srgb,var(--ink)_35%,transparent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ink)_22%,transparent)]";

const btnPrimary =
  "font-ui inline-flex items-center justify-center rounded-xl bg-[color:var(--ink)] px-5 py-2.5 text-sm font-semibold text-[color:var(--paper)] transition-opacity hover:opacity-90 disabled:opacity-50";

const card =
  "rounded-2xl border border-[color:color-mix(in_srgb,var(--ink)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] p-6";

const SOCIAL_FIELDS = [
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/yourstore" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/…" },
  { key: "discord", label: "Discord invite", placeholder: "https://discord.gg/…" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…" },
];

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "-";
  }
}

export default function AdminStorePanel() {
  const { authorizedFetch } = useAuth();
  const { refresh: refreshSiteConfig } = useSiteConfig();
  const [social, setSocial] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cRes = await fetch(apiUrl("/api/v1/site/config"));
      const cData = await parseJson(cRes);
      if (cRes.ok && cData?.social && typeof cData.social === "object") {
        setSocial(cData.social);
      }
    } catch {
      toast.error("Could not load public site config");
    }
    try {
      const iRes = await authorizedFetch("/api/v1/site/contact-inquiries");
      const iData = await parseJson(iRes);
      if (!iRes.ok) throw new Error(iData?.message ?? "Could not load inquiries");
      setInquiries(Array.isArray(iData?.inquiries) ? iData.inquiries : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveSocial(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const body = {};
      for (const { key } of SOCIAL_FIELDS) {
        const v = social[key];
        body[key] = typeof v === "string" ? v.trim() : "";
      }
      const res = await authorizedFetch("/api/v1/site/config", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Save failed");
      setSocial(data?.social ?? {});
      await refreshSiteConfig();
      toast.success("Social links updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="font-ui text-sm text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)]">Loading store settings…</div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8 font-ui">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--ink)]">Store &amp; social</h2>
        <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--ink)_58%,transparent)]">
          Links appear as icons in the site footer when set. Leave blank to hide a network. Clear a field and save to remove.
        </p>
      </div>

      <form className={card} onSubmit={onSaveSocial}>
        <h3 className="mb-4 text-sm font-semibold text-[color:var(--ink)]">Social profiles</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">{label}</span>
              <input
                type="url"
                className={field}
                placeholder={placeholder}
                value={social[key] ?? ""}
                onChange={(e) => setSocial((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button type="submit" className={`${btnPrimary} mt-6`} disabled={saving}>
          {saving ? "Saving…" : "Save social links"}
        </button>
      </form>

      <div className={card}>
        <h3 className="mb-2 text-sm font-semibold text-[color:var(--ink)]">Contact form messages</h3>
        <p className="mb-4 text-xs text-[color:color-mix(in_srgb,var(--ink)_52%,transparent)]">Latest 50 submissions from /contact</p>
        {inquiries.length === 0 ? (
          <p className="text-sm text-[color:color-mix(in_srgb,var(--ink)_48%,transparent)]">No messages yet.</p>
        ) : (
          <ul className="max-h-[min(60vh,520px)] space-y-3 overflow-auto pr-1">
            {inquiries.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_3%,transparent)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-[color:var(--ink)]">{row.name}</span>
                  <time className="text-xs text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">{formatDate(row.createdAt)}</time>
                </div>
                <a href={`mailto:${encodeURIComponent(row.email)}`} className="mt-1 block text-xs text-[color:color-mix(in_srgb,var(--ink)_55%,transparent)] hover:underline">
                  {row.email}
                </a>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[color:color-mix(in_srgb,var(--ink)_78%,transparent)]">{row.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
