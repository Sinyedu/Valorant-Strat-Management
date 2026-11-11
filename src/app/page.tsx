import Link from "next/link";

const features = [
  {
    title: "Organize",
    body: "Nested folders and playbooks keep every map, side, and round plan in one place.",
  },
  {
    title: "Import",
    body: "Pick the tool that made the strat — Wingman, TactiVal, ValoPlant — and upload its export.",
  },
  {
    title: "View",
    body: "Flip through saved scenes and images in the browser. Your original files stay downloadable.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Valorant strategy library
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        One home for every strat your team makes.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Stratbook stores, organizes, and displays strategies created in
        external tools. It is a library and viewer, not an editor.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Open dashboard
      </Link>
      <div className="mt-20 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
