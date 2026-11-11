import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";

async function Wait({ children }: { children: ReactNode }) {
  await connection(); // stop prerendering here; render per request
  return children;
}

/**
 * Renders children at request time only. Needed for forms bound to server
 * actions: Next generates random action ids, which can't be prerendered.
 */
export function RequestTime({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Wait>{children}</Wait>
    </Suspense>
  );
}
