import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-accent">▲</span> Stratbook
        </Link>
        <nav className="flex gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-muted transition hover:bg-border hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
