import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import {
  deleteFolderAction,
  moveFolderAction,
  renameFolderAction,
} from "@/app/dashboard/actions";
import type { FolderDto } from "@/types/folder";

const field =
  "rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent";
const btn = "rounded-md px-2 py-1 text-sm text-muted hover:bg-border hover:text-foreground";

export function FolderRow({ folder, all }: { folder: FolderDto; all: FolderDto[] }) {
  return (
    <li className="p-4">
      <Link
        href={`/dashboard/folders/${folder.id}`}
        className="font-medium hover:text-accent"
      >
        📁 {folder.name}
      </Link>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted">Manage</summary>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <ActionForm action={renameFolderAction}>
            <input type="hidden" name="id" value={folder.id} />
            <input name="name" defaultValue={folder.name} required maxLength={100} className={field} />
            <button className={btn}>Rename</button>
          </ActionForm>
          <ActionForm action={moveFolderAction}>
            <input type="hidden" name="id" value={folder.id} />
            <select name="parentId" defaultValue={folder.parentFolderId ?? ""} className={field}>
              <option value="">Playbooks (top level)</option>
              {all
                .filter((f) => f.id !== folder.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
            </select>
            <button className={btn}>Move</button>
          </ActionForm>
          <ActionForm action={deleteFolderAction}>
            <input type="hidden" name="id" value={folder.id} />
            <button className={btn}>Delete</button>
          </ActionForm>
        </div>
      </details>
    </li>
  );
}
