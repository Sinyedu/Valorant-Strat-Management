import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/server/session";
import { getStrategyDetail } from "@/server/services/strategies";
import { ActionForm } from "@/components/action-form";
import { FrameViewer } from "@/components/frame-viewer";
import { RequestTime } from "@/components/request-time";
import { DeleteStrategyButton } from "@/components/delete-strategy-button";
import { deleteStrategyAction, renameStrategyAction } from "@/app/dashboard/strategy-actions";

export const metadata = { title: "Strategy — Stratbook" };

const SOURCE_LABEL = { wingman: "Wingman", tactival: "TactiVal", valoplant: "ValoPlant", generic: "Generic" };
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

async function StrategyContent({ params }: { params: PageProps<"/dashboard/strategies/[strategyId]">["params"] }) {
  const { workspaceId } = await requireSession();
  const { strategyId } = await params;
  const detail = await getStrategyDetail(workspaceId, strategyId);
  if (!detail) notFound();
  const { strategy, frames, attachments } = detail;
  const back = strategy.folderId ? `/dashboard/folders/${strategy.folderId}` : "/dashboard";

  return (
    <RequestTime>
      <Link href={back} className="text-sm text-muted hover:text-foreground">← Back to folder</Link>
      <h1 className="sr-only">{strategy.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <ActionForm action={renameStrategyAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={strategy.id} />
          <input
            name="title"
            defaultValue={strategy.title}
            required
            maxLength={120}
            aria-label="Strategy title"
            className="w-full min-w-0 max-w-72 rounded-md border border-field bg-transparent px-2 py-1 text-2xl font-bold tracking-tight"
          />
          <button className="rounded-md px-2 py-1 text-sm text-muted hover:bg-border">Rename title</button>
        </ActionForm>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
          {SOURCE_LABEL[strategy.source]}
        </span>
      </div>

      <div className="mt-6"><FrameViewer frames={frames} /></div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Original files</h2>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3">
              <span className="truncate">{a.originalName} <span className="text-muted">· {kb(a.size)}</span></span>
              <a href={`/api/attachments/${a.id}?download=1`} className="shrink-0 text-accent hover:underline">Download</a>
            </li>
          ))}
        </ul>
      </section>

      <ActionForm action={deleteStrategyAction} className="mt-8">
        <input type="hidden" name="id" value={strategy.id} />
        <DeleteStrategyButton title={strategy.title} />
      </ActionForm>
    </RequestTime>
  );
}

export default function StrategyPage(props: PageProps<"/dashboard/strategies/[strategyId]">) {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-muted">Loading…</p>}>
      <StrategyContent params={props.params} />
    </Suspense>
  );
}
