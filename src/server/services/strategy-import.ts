import "server-only";
import { createHash } from "node:crypto";
import { connectToDatabase } from "@/server/db/mongoose";
import { Folder } from "@/server/models/folder";
import { Strategy } from "@/server/models/strategy";
import { StrategyAttachment } from "@/server/models/strategy-attachment";
import { StrategyFrame } from "@/server/models/strategy-frame";
import { isImageSource, parseImage, type ParsedImage } from "@/server/import/image";
import { ImportError } from "@/server/import/types";
import type { StrategySource } from "@/types/strategy";
import { getStorage } from "@/server/storage";
import { newObjectKey } from "@/server/storage/local";
import { objectIdSchema } from "@/lib/validation/folder";
import { deleteStrategyData } from "./strategy-cleanup";

export const MAX_FILES_PER_IMPORT = 25;

export type ImportInput = {
  folderId: string | null;
  source: string;
  group: boolean;
  files: { name: string; bytes: Uint8Array }[];
};

/** Connects and checks the destination folder belongs to the workspace. */
export async function assertFolder(workspaceId: string, folderId: string | null): Promise<void> {
  await connectToDatabase();
  if (!folderId) return;
  const ok = objectIdSchema.safeParse(folderId).success && (await Folder.exists({ _id: folderId, workspaceId }));
  if (!ok) throw new ImportError("Folder not found");
}

async function createStrategy(
  workspaceId: string,
  folderId: string | null,
  source: StrategySource,
  items: ParsedImage[],
): Promise<string> {
  const storage = getStorage();
  const keys: string[] = [];
  let strategyId: string | undefined;
  try {
    const strategy = await Strategy.create({
      workspaceId,
      folderId,
      source,
      title: items[0].result.suggestedTitle,
      status: "processing",
    });
    strategyId = String(strategy._id);
    for (const [order, item] of items.entries()) {
      const key = newObjectKey(workspaceId);
      keys.push(key); // tracked before writing so a failed write is still cleaned up
      await storage.put(key, item.bytes, item.type.mime);
      const attachment = await StrategyAttachment.create({
        workspaceId,
        strategyId,
        objectKey: key,
        originalName: item.originalName,
        contentType: item.type.mime,
        size: item.bytes.length,
        sha256: createHash("sha256").update(item.bytes).digest("hex"),
      });
      await StrategyFrame.create({
        workspaceId,
        strategyId,
        order,
        kind: "image",
        attachmentId: attachment._id,
        name: item.result.suggestedTitle,
      });
    }
    await Strategy.updateOne({ _id: strategyId }, { status: "ready" });
    return strategyId;
  } catch (e) {
    await Promise.allSettled(keys.map((k) => storage.delete(k)));
    if (strategyId) {
      await deleteStrategyData(workspaceId, strategyId, { deleteObjects: false });
    }
    throw e;
  }
}

/**
 * Validates every file first, then saves. All-or-nothing: if any strategy fails,
 * the ones already created in this call are removed too.
 */
export async function importImages(workspaceId: string, input: ImportInput): Promise<string[]> {
  if (!isImageSource(input.source)) {
    throw new ImportError("This source is not supported for image upload yet");
  }
  if (input.files.length === 0) throw new ImportError("Choose at least one file");
  if (input.files.length > MAX_FILES_PER_IMPORT) {
    throw new ImportError(`Too many files (max ${MAX_FILES_PER_IMPORT} per upload)`);
  }
  const source = input.source; // narrowed to an image source by the guard above
  const parsed = input.files.map(parseImage);

  await assertFolder(workspaceId, input.folderId);

  const groups = input.group ? [parsed] : parsed.map((p) => [p]);
  const created: string[] = [];
  try {
    for (const g of groups) {
      created.push(await createStrategy(workspaceId, input.folderId, source, g));
    }
  } catch (e) {
    await Promise.allSettled(created.map((id) => deleteStrategyData(workspaceId, id)));
    throw e;
  }
  return created;
}
