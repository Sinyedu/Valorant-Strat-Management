import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/server/session";
import { listStrategies } from "@/server/services/strategies";
import {
  getBreadcrumbs,
  getFolder,
  listAllFolders,
  listChildren,
} from "@/server/services/folders";
import { ActionForm } from "@/components/action-form";
import { StrategyList } from "@/components/strategy-list";
import { RequestTime } from "@/components/request-time";
import { FolderRow } from "@/components/folder-row";
import { createFolderAction } from "@/app/dashboard/actions";

export async function FolderView({ folderId }: { folderId: string | null }) {
  const { workspaceId } = await requireSession();
  if (folderId && !(await getFolder(workspaceId, folderId))) notFound();

  const [children, all, trail, strategies] = await Promise.all([
    listChildren(workspaceId, folderId),
    listAllFolders(workspaceId),
    folderId ? getBreadcrumbs(workspaceId, folderId) : Promise.resolve([]),
    listStrategies(workspaceId, folderId),
  ]);

  return (
    <RequestTime>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/dashboard" className="hover:text-foreground">Playbooks</Link>
        {trail.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <span aria-hidden="true">/</span>
            <Link href={`/dashboard/folders/${f.id}`} className="hover:text-foreground">{f.name}</Link>
          </span>
        ))}
      </nav>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {trail.at(-1)?.name ?? "Playbooks"}
        </h1>
        {/* Uploading strategies is the product's core action, so it is the primary button. */}
        <Link
          href={folderId ? `/dashboard/upload?folderId=${folderId}` : "/dashboard/upload"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110"
        >
          Upload strategies
        </Link>
      </div>

      <ActionForm action={createFolderAction} className="mt-6">
        <div className="flex flex-wrap gap-2">
          <input type="hidden" name="parentId" value={folderId ?? ""} />
          <input
            name="name"
            required
            maxLength={100}
            aria-label="New folder name"
            placeholder="New folder name"
            className="min-w-0 flex-1 rounded-md border border-field bg-background px-3 py-2 text-sm sm:w-64 sm:flex-none"
          />
          <button className="rounded-md border border-field px-4 py-2 text-sm font-medium hover:bg-border">
            Create folder
          </button>
        </div>
      </ActionForm>

      {children.length === 0 && strategies.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          Nothing here yet. Upload your first strategy, or create a folder to organize them.
        </p>
      ) : (
        children.length > 0 && (
          <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-surface">
            {children.map((f) => (
              <FolderRow key={f.id} folder={f} all={all} />
            ))}
          </ul>
        )
      )}

      <StrategyList strategies={strategies} />
    </RequestTime>
  );
}
