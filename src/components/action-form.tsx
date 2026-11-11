"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/types/action";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
};

/** A form that shows the error returned by its server action. */
export function ActionForm({ action, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // Controls stay enabled while pending: disabling the focused submit button would
  // drop keyboard focus to the page (WCAG 2.4.3). Progress is announced instead.
  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      <p role="status" className="sr-only">{pending ? "Working…" : ""}</p>
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-accent">
          {state.error}
        </p>
      )}
    </form>
  );
}
