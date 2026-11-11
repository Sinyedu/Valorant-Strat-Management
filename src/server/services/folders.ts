import "server-only";
import { connectToDatabase } from "@/server/db/mongoose";
import { Folder } from "@/server/models/folder";
import { Strategy } from "@/server/models/strategy";
import { wouldCreateCycle } from "./folder-tree";
import { folderNameSchema, objectIdSchema } from "@/lib/validation/folder";
import type { FolderDto } from "@/types/folder";

export class FolderError extends Error {}

const LIST_LIMIT = 500;

type Lean = { _id: unknown; name: string; parentFolderId?: unknown };
const toDto = (f: Lean): FolderDto => ({
  id: String(f._id),
  name: f.name,
  parentFolderId: f.parentFolderId ? String(f.parentFolderId) : null,
});

const validId = (id: string) => {
  if (!objectIdSchema.safeParse(id).success) {
    throw new FolderError("Folder not found");
  }
  return id;
};
const validName = (name: string) => {
  const r = folderNameSchema.safeParse(name);
  if (!r.success) throw new FolderError(r.error.issues[0].message);
  return r.data;
};
const rethrowDuplicate = (e: unknown): never => {
  if ((e as { code?: number }).code === 11000) {
    throw new FolderError("A folder with that name already exists here");
  }
  throw e;
};

async function assertInWorkspace(workspaceId: string, id: string) {
  const found = await Folder.exists({ _id: validId(id), workspaceId });
  if (!found) throw new FolderError("Folder not found");
}

export async function getFolder(workspaceId: string, id: string) {
  if (!objectIdSchema.safeParse(id).success) return null;
  await connectToDatabase();
  const f = await Folder.findOne({ _id: id, workspaceId }).lean();
  return f ? toDto(f) : null;
}

export async function listChildren(
  workspaceId: string,
  parentId: string | null,
): Promise<FolderDto[]> {
  await connectToDatabase();
  const rows = await Folder.find({ workspaceId, parentFolderId: parentId })
    .sort({ name: 1 })
    .limit(LIST_LIMIT)
    .lean();
  return rows.map(toDto);
}

export async function listAllFolders(workspaceId: string): Promise<FolderDto[]> {
  await connectToDatabase();
  const rows = await Folder.find({ workspaceId })
    .sort({ name: 1 })
    .limit(LIST_LIMIT)
    .lean();
  return rows.map(toDto);
}

export async function getBreadcrumbs(
  workspaceId: string,
  id: string,
): Promise<FolderDto[]> {
  const trail: FolderDto[] = [];
  let current: string | null = id;
  while (current && trail.length < 100) {
    const f: FolderDto | null = await getFolder(workspaceId, current);
    if (!f) break;
    trail.unshift(f);
    current = f.parentFolderId;
  }
  return trail;
}

export async function createFolder(
  workspaceId: string,
  parentId: string | null,
  name: string,
) {
  const clean = validName(name);
  await connectToDatabase();
  if (parentId) await assertInWorkspace(workspaceId, parentId);
  try {
    await Folder.create({ workspaceId, parentFolderId: parentId, name: clean });
  } catch (e) {
    rethrowDuplicate(e);
  }
}

export async function renameFolder(workspaceId: string, id: string, name: string) {
  const clean = validName(name);
  await connectToDatabase();
  let matched = 0;
  try {
    const r = await Folder.updateOne(
      { _id: validId(id), workspaceId },
      { name: clean },
    );
    matched = r.matchedCount;
  } catch (e) {
    if (e instanceof FolderError) throw e;
    rethrowDuplicate(e);
  }
  if (matched === 0) throw new FolderError("Folder not found");
}

export async function moveFolder(
  workspaceId: string,
  id: string,
  newParentId: string | null,
) {
  await connectToDatabase();
  await assertInWorkspace(workspaceId, id);
  if (newParentId) await assertInWorkspace(workspaceId, newParentId);
  const cyclic = await wouldCreateCycle(id, newParentId, async (fid) => {
    const f = await Folder.findOne({ _id: fid, workspaceId })
      .select("parentFolderId")
      .lean();
    if (!f) return undefined;
    return f.parentFolderId ? String(f.parentFolderId) : null;
  });
  if (cyclic) {
    throw new FolderError("A folder cannot be moved into itself or its subfolders");
  }
  try {
    await Folder.updateOne({ _id: id, workspaceId }, { parentFolderId: newParentId });
  } catch (e) {
    rethrowDuplicate(e);
  }
}

/** Deletes an empty folder (no subfolders, no strategies). Cascade deletes are not implemented. */
export async function deleteFolder(workspaceId: string, id: string) {
  await connectToDatabase();
  await assertInWorkspace(workspaceId, id);
  if (await Folder.exists({ workspaceId, parentFolderId: id })) {
    throw new FolderError("Folder is not empty");
  }
  // Includes in-progress imports: deleting under them would orphan the new strategy.
  if (await Strategy.exists({ workspaceId, folderId: id })) {
    throw new FolderError("Folder is not empty");
  }
  await Folder.deleteOne({ _id: id, workspaceId });
}
