"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 5 * 1024 * 1024;

type Summary = {
  title: string;
  mapId: string | null;
  scenes: { name: string; mapId: string | null; elements: number; unsupported: number }[];
};

async function post(file: File, folderId: string | null, dryRun: boolean) {
  const body = new FormData();
  body.set("source", "wingman");
  body.set("folderId", folderId ?? "");
  body.set("dryRun", String(dryRun));
  body.append("files", file);
  const res = await fetch("/api/strategies/import", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data;
}

export function WingmanUpload({ folderId }: { folderId: string | null }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(f: File | undefined) {
    setSummary(null);
    setError(null);
    setFile(null);
    if (!f) return;
    if (f.size > MAX_BYTES) return setError(`${f.name}: larger than 5 MB`);
    setFile(f);
    setBusy(true);
    try {
      setSummary((await post(f, folderId, true)) as Summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file");
    }
    setBusy(false);
  }

  async function save() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = (await post(file, folderId, false)) as { strategyIds?: string[] };
      router.push(`/dashboard/strategies/${data.strategyIds?.[0] ?? ""}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
    }
  }

  const maps = summary ? [...new Set(summary.scenes.map((s) => s.mapId ?? "unknown"))] : [];
  return (
    <div className="space-y-4">
      <label className="block rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm">
        <span className="text-muted">Choose a Wingman .map export</span>
        <input
          type="file"
          accept=".map"
          className="mt-3 block w-full text-sm"
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>

      {busy && !summary && <p role="status" className="text-sm text-muted">Reading file…</p>}
      {summary && file && (
        <section aria-label="Import preview" className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium">{file.name}</p>
          <p className="text-muted">
            {summary.scenes.length} scene{summary.scenes.length === 1 ? "" : "s"} · map: {maps.join(", ")}
          </p>
          <ul className="mt-2 list-disc pl-5">
            {summary.scenes.map((s, i) => (
              <li key={i}>
                {s.name || `Scene ${i + 1}`} — {s.elements} elements
                {s.unsupported > 0 && <span className="text-muted"> ({s.unsupported} unsupported, not shown)</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p role="alert" className="text-sm text-accent">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={busy || !summary}
        className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50"
      >
        {busy && summary ? "Saving…" : "Save strategy"}
      </button>
    </div>
  );
}
