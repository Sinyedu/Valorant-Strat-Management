"use client";

import { useCallback, useEffect, useState } from "react";
import type { FrameDto } from "@/types/strategy";

export function FrameViewer({ frames }: { frames: FrameDto[] }) {
  const [index, setIndex] = useState(0);
  const last = frames.length - 1;
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (frames.length === 0) return <p className="text-sm text-muted">This strategy has no frames.</p>;
  const frame = frames[index];
  // aria-disabled (not `disabled`) keeps keyboard focus on the button at either end (WCAG 2.4.3).
  const btn =
    "rounded-md border border-field px-3 py-1.5 text-sm hover:bg-border aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent";

  return (
    <section aria-label="Strategy frames">
      <div className="overflow-hidden rounded-lg border border-border bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- auth-protected route; the image optimizer would not carry the session cookie */}
        <img
          key={frame.id}
          src={`/api/attachments/${frame.attachmentId}`}
          alt={frame.name ?? `Frame ${index + 1}`}
          className="mx-auto max-h-[75vh] w-auto max-w-full"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" onClick={prev} aria-disabled={index === 0} className={btn}>
          <span aria-hidden="true">← </span>Previous
        </button>
        <p role="status" aria-live="polite" className="text-center text-sm text-muted">
          {frame.name ? `${frame.name} · ` : ""}
          Frame {index + 1} of {frames.length}
        </p>
        <button type="button" onClick={next} aria-disabled={index === last} className={btn}>
          Next<span aria-hidden="true"> →</span>
        </button>
      </div>
      {frames.length > 1 && (
        <p className="mt-2 text-center text-xs text-muted">Tip: use the left and right arrow keys.</p>
      )}
    </section>
  );
}
