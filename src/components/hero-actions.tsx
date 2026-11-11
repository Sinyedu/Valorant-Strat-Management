import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";

const primary =
  "inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110";
const secondary =
  "inline-block rounded-md border border-field px-5 py-2.5 text-sm font-medium transition hover:bg-border";

function SignedOut() {
  return (
    <>
      <Link href="/signup" className={primary}>Get started</Link>
      <Link href="/login" className={secondary}>Log in</Link>
    </>
  );
}

async function Actions() {
  await connection(); // reads the session; keep out of prerendering
  const session = await auth();
  if (!session?.user) return <SignedOut />;
  return <Link href="/dashboard" className={primary}>Open dashboard</Link>;
}

/** Signed-out visitors are sent to sign up, not to a login wall labelled "dashboard". */
export function HeroActions() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Suspense fallback={<SignedOut />}>
        <Actions />
      </Suspense>
    </div>
  );
}
