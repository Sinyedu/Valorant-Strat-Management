import Link from "next/link";
import type { StrategyDto } from "@/types/strategy";

const SOURCE_LABEL = { wingman: "Wingman", tactival: "TactiVal", valoplant: "ValoPlant", generic: "Generic" };

export function StrategyList({ strategies }: { strategies: StrategyDto[] }) {
  if (strategies.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold">Strategies</h2>
      <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
        {strategies.map((s) => (
          <li key={s.id}>
            <Link href={`/dashboard/strategies/${s.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-border/40">
              <span className="truncate font-medium">{s.title}</span>
              <span className="shrink-0 text-xs text-muted">{SOURCE_LABEL[s.source]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
