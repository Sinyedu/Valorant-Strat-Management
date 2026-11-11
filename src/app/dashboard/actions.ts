"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/session";
import {
  createFolder,
  deleteFolder,
  FolderError,
  moveFolder,
  renameFolder,
} from "@/server/services/folders";
import { objectIdSchema, optionalParentSchema } from "@/lib/validation/folder";
import type { ActionState } from "@/types/action";

// workspaceId always comes from the session, never from form data.
async function run(
  fn: (workspaceId: string) => Promise<void>,
): Promise<ActionState> {
  const { workspaceId } = await requireSession();
  try {
    await fn(workspaceId);
  } catch (e) {
    if (e instanceof FolderError) return { error: e.message };
    console.error("Folder action failed");
    return { error: "Something went wrong. Try again." };
  }
  revalidatePath("/dashboard", "layout");
  return {};
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function createFolderAction(_p: ActionState, f: FormData) {
  const parent = optionalParentSchema.safeParse(str(f, "parentId"));
  if (!parent.success) return { error: "Folder not found" };
  return run((ws) => createFolder(ws, parent.data, str(f, "name")));
}

export async function renameFolderAction(_p: ActionState, f: FormData) {
  const id = objectIdSchema.safeParse(str(f, "id"));
  if (!id.success) return { error: "Folder not found" };
  return run((ws) => renameFolder(ws, id.data, str(f, "name")));
}

export async function moveFolderAction(_p: ActionState, f: FormData) {
  const id = objectIdSchema.safeParse(str(f, "id"));
  const parent = optionalParentSchema.safeParse(str(f, "parentId"));
  if (!id.success || !parent.success) return { error: "Folder not found" };
  return run((ws) => moveFolder(ws, id.data, parent.data));
}

export async function deleteFolderAction(_p: ActionState, f: FormData) {
  const id = objectIdSchema.safeParse(str(f, "id"));
  if (!id.success) return { error: "Folder not found" };
  return run((ws) => deleteFolder(ws, id.data));
}
