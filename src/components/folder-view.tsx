import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/server/session";
import {
  getBreadcrumbs,
  getFolder,
  listAllFolders,
  listChildren,
} from "@/server/services/folders";
import { ActionForm } from "@/components/action-form";
import { RequestTime } from "@/components/request-time";
import { FolderRow } from "@/components/folder-row";
import { createFolderAction } from "@/app/dashboard/actions";

export async function FolderView({ folderId }: { folderId: string | null }) {
  const { workspaceId } = await requireSession();
  if (folderId && !(await getFolder(workspaceId, folderId))) notFound();

  const [children, all, trail] = await Promise.all([
    listChildren(workspaceId, folderId),
    listAllFolders(workspaceId),
    folderId ? getBreadcrumbs(workspaceId, folderId) : Promise.resolve([]),
  ]);

  return (
    <RequestTime>
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/dashboard" className="hover:text-foreground">Playbooks</Link>
        {trail.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            / <Link href={`/dashboard/folders/${f.id}`} className="hover:text-foreground">{f.name}</Link>
          </span>
        ))}
      </nav>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        {trail.at(-1)?.name ?? "Playbooks"}
      </h1>

      <ActionForm action={createFolderAction} className="mt-6">
        <div className="flex gap-2">
          <input type="hidden" name="parentId" value={folderId ?? ""} />
          <input
            name="name"
            required
            maxLength={100}
            placeholder="New folder name"
            className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            Create folder
          </button>
        </div>
      </ActionForm>

      {children.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          No folders here yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-surface">
          {children.map((f) => (
            <FolderRow key={f.id} folder={f} all={all} />
          ))}
        </ul>
      )}
    </RequestTime>
  );
}
