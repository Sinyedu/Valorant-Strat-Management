"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WingmanUpload } from "@/components/wingman-upload";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILES = 25;
const MAX_BYTES = 10 * 1024 * 1024;

type Picked = { id: string; file: File; url: string };

const SOURCES = [
  { value: "tactival", label: "TactiVal (image)" },
  { value: "valoplant", label: "ValoPlant (image)" },
  { value: "generic", label: "Generic (image)" },
  { value: "wingman", label: "Wingman (.map)" },
];

function ImageUpload({ folderId, source }: { folderId: string | null; source: string }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked[]>([]);
  const [group, setGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const all = urls.current;
    return () => all.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function add(list: FileList | File[]) {
    const next: Picked[] = [];
    let problem: string | null = null;
    for (const file of Array.from(list)) {
      if (!ACCEPT.includes(file.type)) problem = `${file.name}: only PNG, JPEG, or WebP`;
      else if (file.size > MAX_BYTES) problem = `${file.name}: larger than 10 MB`;
      else {
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        next.push({ id: crypto.randomUUID(), file, url });
      }
    }
    setPicked((prev) => {
      const merged = [...prev, ...next];
      if (merged.length > MAX_FILES) problem = `At most ${MAX_FILES} files per upload`;
      return merged.slice(0, MAX_FILES);
    });
    setError(problem);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const body = new FormData();
    body.set("source", source);
    body.set("folderId", folderId ?? "");
    body.set("group", String(group));
    picked.forEach((p) => body.append("files", p.file));
    try {
      const res = await fetch("/api/strategies/import", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        strategyIds?: string[];
      };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      const ids = data.strategyIds ?? [];
      router.push(
        ids.length === 1
          ? `/dashboard/strategies/${ids[0]}`
          : folderId
            ? `/dashboard/folders/${folderId}`
            : "/dashboard",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setSaving(false);
    }
  }

  return (
    <>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed border-border bg-surface p-8 text-center"
      >
        <p className="text-sm text-muted">Drop PNG, JPEG, or WebP files here, or</p>
        <label className="mt-3 inline-block cursor-pointer rounded-md bg-border px-4 py-2 text-sm font-medium hover:brightness-125 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          Choose files
          <input
            type="file"
            multiple
            accept={ACCEPT.join(",")}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {picked.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {picked.map((p) => (
              <li key={p.id} className="rounded-lg border border-border bg-surface p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={p.url} alt={p.file.name} className="aspect-video w-full rounded object-cover" />
                <p className="mt-1 truncate text-xs text-muted" title={p.file.name}>{p.file.name}</p>
                <button
                  type="button"
                  onClick={() => setPicked((prev) => prev.filter((x) => x.id !== p.id))}
                  aria-label={`Remove ${p.file.name}`}
                  className="inline-flex min-h-6 items-center px-1 text-xs text-accent underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {picked.length > 1 && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={group} onChange={(e) => setGroup(e.target.checked)} />
              Group all {picked.length} images into one strategy (otherwise one strategy per image)
            </label>
          )}
        </>
      )}

      {error && <p role="alert" className="text-sm text-accent">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving || picked.length === 0}
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50"
      >
        {saving
          ? "Saving…"
          : group || picked.length <= 1
            ? "Save strategy"
            : `Save ${picked.length} strategies`}
      </button>
    </>
  );
}

export function UploadForm({ folderId }: { folderId: string | null }) {
  const [source, setSource] = useState("tactival");
  const field = "mt-1 rounded-md border border-field bg-background px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <label className="block text-sm">
        Source
        <select value={source} onChange={(e) => setSource(e.target.value)} className={`${field} block`}>
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      {source === "wingman" ? (
        <WingmanUpload folderId={folderId} />
      ) : (
        // key resets picked files when switching between image sources
        <ImageUpload key={source} folderId={folderId} source={source} />
      )}
    </div>
  );
}
