import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";

const UPLOAD_PATH = "/api/v1/admin/catalog/upload";

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function AdminImageUrlField({
  label,
  value,
  onChange,
  authorizedFetch,
  inputClassName,
  placeholder = "https://…",
}) {
  const [uploading, setUploading] = useState(false);

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await authorizedFetch(UPLOAD_PATH, { method: "POST", body: fd });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Upload failed");
      if (!data?.url) throw new Error("No URL returned");
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <span className="block text-xs font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--ink)_45%,transparent)]">
          {label}
        </span>
      ) : null}
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          type="text"
          className={inputClassName}
          style={{ flex: "1 1 12rem" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[color:color-mix(in_srgb,var(--ink)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--ink)_4%,transparent)] px-3 py-2 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          <span>{uploading ? "…" : "Upload"}</span>
          <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onPickFile} />
        </label>
      </div>
    </div>
  );
}
