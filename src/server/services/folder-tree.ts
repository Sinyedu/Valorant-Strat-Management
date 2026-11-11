export const MAX_FOLDER_DEPTH = 100;

type ParentLookup = (id: string) => Promise<string | null | undefined>;

/**
 * True if making `newParentId` the parent of `folderId` would create a cycle
 * (the new parent is the folder itself or one of its descendants).
 * `getParentId` returns undefined when a folder does not exist.
 */
export async function wouldCreateCycle(
  folderId: string,
  newParentId: string | null,
  getParentId: ParentLookup,
): Promise<boolean> {
  let current = newParentId;
  for (let depth = 0; current !== null; depth++) {
    if (current === folderId) return true;
    if (depth >= MAX_FOLDER_DEPTH) return true; // corrupt or absurdly deep: refuse
    const parent = await getParentId(current);
    if (parent === undefined) return false;
    current = parent;
  }
  return false;
}
