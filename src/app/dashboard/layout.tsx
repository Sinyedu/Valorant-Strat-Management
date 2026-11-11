import { Suspense, type ReactNode } from "react";
import { requireSession } from "@/server/session";

async function Guard({ children }: { children: ReactNode }) {
  await requireSession();
  return children;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <Guard>{children}</Guard>
      </Suspense>
    </div>
  );
}
