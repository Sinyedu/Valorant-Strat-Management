"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/server/session";
import { deleteStrategy, renameStrategy, StrategyError } from "@/server/services/strategies";
import { objectIdSchema } from "@/lib/validation/folder";
import type { ActionState } from "@/types/action";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

// workspaceId always comes from the session, never from form data.
export async function renameStrategyAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const { workspaceId } = await requireSession();
  const id = objectIdSchema.safeParse(str(f, "id"));
  if (!id.success) return { error: "Strategy not found" };
  try {
    await renameStrategy(workspaceId, id.data, str(f, "title"));
  } catch (e) {
    if (e instanceof StrategyError) return { error: e.message };
    console.error("Rename failed");
    return { error: "Something went wrong. Try again." };
  }
  revalidatePath("/dashboard", "layout");
  return {};
}

export async function deleteStrategyAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const { workspaceId } = await requireSession();
  const id = objectIdSchema.safeParse(str(f, "id"));
  if (!id.success) return { error: "Strategy not found" };
  let folderId: string | null;
  try {
    folderId = await deleteStrategy(workspaceId, id.data);
  } catch (e) {
    if (e instanceof StrategyError) return { error: e.message };
    console.error("Delete failed");
    return { error: "Something went wrong. Try again." };
  }
  revalidatePath("/dashboard", "layout");
  redirect(folderId ? `/dashboard/folders/${folderId}` : "/dashboard");
}
