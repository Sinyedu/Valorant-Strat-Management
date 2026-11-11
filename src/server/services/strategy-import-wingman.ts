import "server-only";
import { createHash } from "node:crypto";
import { Strategy } from "@/server/models/strategy";
import { StrategyAttachment } from "@/server/models/strategy-attachment";
import { StrategyFrame } from "@/server/models/strategy-frame";
import { parseWingman } from "@/server/import/wingman/parse";
import { getStorage } from "@/server/storage";
import { newObjectKey } from "@/server/storage/local";
import { assertFolder } from "./strategy-import";
import { deleteStrategyData } from "./strategy-cleanup";

/** Imports one Wingman `.map` as one strategy with one frame per scene. Returns the strategy id. */
export async function importWingman(
  workspaceId: string,
  input: { folderId: string | null; file: { name: string; bytes: Uint8Array } },
): Promise<string> {
  const parsed = parseWingman(input.file); // validate before touching storage or the database
  await assertFolder(workspaceId, input.folderId);

  const storage = getStorage();
  const key = newObjectKey(workspaceId);
  let strategyId: string | undefined;
  try {
    const strategy = await Strategy.create({
      workspaceId,
      folderId: input.folderId,
      source: "wingman",
      title: parsed.result.suggestedTitle,
      mapId: parsed.result.mapId,
      status: "processing",
    });
    strategyId = String(strategy._id);
    await storage.put(key, input.file.bytes, "application/octet-stream");
    const attachment = await StrategyAttachment.create({
      workspaceId,
      strategyId,
      objectKey: key,
      originalName: parsed.originalName,
      contentType: "application/octet-stream",
      size: input.file.bytes.length,
      sha256: createHash("sha256").update(input.file.bytes).digest("hex"),
    });
    for (const f of parsed.result.frames) {
      await StrategyFrame.create({
        workspaceId,
        strategyId,
        order: f.order,
        kind: "tactical-scene",
        attachmentId: attachment._id,
        name: f.name,
        scene: f.previewData,
      });
    }
    await Strategy.updateOne({ _id: strategyId }, { status: "ready" });
    return strategyId;
  } catch (e) {
    await storage.delete(key).catch(() => undefined);
    if (strategyId) await deleteStrategyData(workspaceId, strategyId, { deleteObjects: false });
    throw e;
  }
}
