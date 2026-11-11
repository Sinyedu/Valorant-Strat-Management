import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { signOutAction } from "@/app/auth-actions";

const linkClass =
  "rounded-md px-3 py-1.5 text-muted transition hover:bg-border hover:text-foreground";

// Reads the session, so it must render inside <Suspense> (Cache Components).
async function AuthNav() {
  await connection(); // Auth.js uses crypto; keep it out of prerendering
  const session = await auth();
  if (!session?.user) {
    return (
      <>
        <Link href="/login" className={linkClass}>Log in</Link>
        <Link href="/signup" className={linkClass}>Sign up</Link>
      </>
    );
  }
  return (
    <>
      <Link href="/dashboard" className={linkClass}>Dashboard</Link>
      <form action={signOutAction}>
        <button className={linkClass}>Log out</button>
      </form>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-accent">▲</span> Stratbook
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Suspense fallback={null}>
            <AuthNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
