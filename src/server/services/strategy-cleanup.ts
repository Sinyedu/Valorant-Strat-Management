import "server-only";
import { Strategy } from "@/server/models/strategy";
import { StrategyAttachment } from "@/server/models/strategy-attachment";
import { StrategyFrame } from "@/server/models/strategy-frame";
import { getStorage } from "@/server/storage";

/**
 * Removes a strategy's documents and (optionally) its stored objects.
 * Documents go first so a half-deleted strategy never points at missing files;
 * leftover objects are harmless orphans, leftover documents are not.
 */
export async function deleteStrategyData(
  workspaceId: string,
  strategyId: string,
  opts: { deleteObjects?: boolean } = {},
): Promise<void> {
  const { deleteObjects = true } = opts;
  const attachments = await StrategyAttachment.find({ workspaceId, strategyId })
    .select("objectKey")
    .lean();
  await StrategyFrame.deleteMany({ workspaceId, strategyId });
  await StrategyAttachment.deleteMany({ workspaceId, strategyId });
  await Strategy.deleteOne({ _id: strategyId, workspaceId });
  if (deleteObjects) {
    const storage = getStorage();
    await Promise.allSettled(attachments.map((a) => storage.delete(a.objectKey)));
  }
}
