"use client";

import { useState } from "react";

/** Two-step delete: deleting a strategy permanently removes its stored originals. */
export function DeleteStrategyButton({ title }: { title: string }) {
  const [confirming, setConfirming] = useState(false);
  const base = "rounded-md border px-3 py-1.5 text-sm";

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${base} border-field text-muted hover:bg-border hover:text-foreground`}
      >
        Delete strategy
      </button>
    );
  }
  return (
    <div role="group" aria-label="Confirm deletion" className="flex flex-wrap items-center gap-2">
      <p className="text-sm">
        Permanently delete “{title}” and its original files? This cannot be undone.
      </p>
      <button type="submit" className={`${base} border-accent bg-accent font-semibold text-background`}>
        Yes, delete
      </button>
      <button
        type="button"
        autoFocus
        onClick={() => setConfirming(false)}
        className={`${base} border-field hover:bg-border`}
      >
        Cancel
      </button>
    </div>
  );
}
