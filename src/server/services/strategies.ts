import "server-only";
import { connectToDatabase } from "@/server/db/mongoose";
import { Strategy } from "@/server/models/strategy";
import { StrategyAttachment } from "@/server/models/strategy-attachment";
import { StrategyFrame } from "@/server/models/strategy-frame";
import { getStorage } from "@/server/storage";
import { objectIdSchema } from "@/lib/validation/folder";
import { strategyTitleSchema } from "@/lib/validation/strategy";
import { deleteStrategyData } from "./strategy-cleanup";
import type { StrategyDetailDto, StrategyDto } from "@/types/strategy";

export class StrategyError extends Error {}

const LIST_LIMIT = 500;
const FRAME_LIMIT = 200;
const READY = { status: "ready" } as const;

type StrategyLean = {
  _id: unknown;
  title: string;
  source: StrategyDto["source"];
  folderId?: unknown;
  mapId?: string | null;
  side?: StrategyDto["side"];
  tags?: string[];
  createdAt?: Date;
};

const toDto = (s: StrategyLean): StrategyDto => ({
  id: String(s._id),
  title: s.title,
  source: s.source,
  folderId: s.folderId ? String(s.folderId) : null,
  mapId: s.mapId ?? null,
  side: s.side ?? null,
  tags: s.tags ?? [],
  createdAt: (s.createdAt ?? new Date(0)).toISOString(),
});

const validId = (id: string) => {
  if (!objectIdSchema.safeParse(id).success) throw new StrategyError("Strategy not found");
  return id;
};

export async function listStrategies(
  workspaceId: string,
  folderId: string | null,
): Promise<StrategyDto[]> {
  await connectToDatabase();
  const rows = await Strategy.find({ workspaceId, folderId, ...READY })
    .sort({ createdAt: -1 })
    .limit(LIST_LIMIT)
    .lean();
  return rows.map(toDto);
}

export async function getStrategyDetail(
  workspaceId: string,
  id: string,
): Promise<StrategyDetailDto | null> {
  if (!objectIdSchema.safeParse(id).success) return null;
  await connectToDatabase();
  const strategy = await Strategy.findOne({ _id: id, workspaceId, ...READY }).lean();
  if (!strategy) return null;
  const [frames, attachments] = await Promise.all([
    StrategyFrame.find({ workspaceId, strategyId: id }).sort({ order: 1 }).limit(FRAME_LIMIT).lean(),
    StrategyAttachment.find({ workspaceId, strategyId: id }).sort({ _id: 1 }).limit(FRAME_LIMIT).lean(),
  ]);
  return {
    strategy: toDto(strategy),
    frames: frames.map((f) => ({
      id: String(f._id),
      order: f.order,
      name: f.name ?? null,
      attachmentId: String(f.attachmentId),
    })),
    attachments: attachments.map((a) => ({
      id: String(a._id),
      originalName: a.originalName,
      contentType: a.contentType,
      size: a.size,
    })),
  };
}

export async function renameStrategy(workspaceId: string, id: string, title: string) {
  const parsed = strategyTitleSchema.safeParse(title);
  if (!parsed.success) throw new StrategyError(parsed.error.issues[0].message);
  await connectToDatabase();
  const r = await Strategy.updateOne(
    { _id: validId(id), workspaceId, ...READY },
    { title: parsed.data },
  );
  if (r.matchedCount === 0) throw new StrategyError("Strategy not found");
}

/** Deletes a strategy and its stored originals. Returns its folder id for redirects. */
export async function deleteStrategy(workspaceId: string, id: string): Promise<string | null> {
  await connectToDatabase();
  const s = await Strategy.findOne({ _id: validId(id), workspaceId, ...READY })
    .select("folderId")
    .lean();
  if (!s) throw new StrategyError("Strategy not found");
  await deleteStrategyData(workspaceId, id);
  return s.folderId ? String(s.folderId) : null;
}

export type AttachmentFile = { bytes: Uint8Array; contentType: string; originalName: string };

/** Loads an original file. Workspace ownership is enforced in the query. */
export async function getAttachmentFile(
  workspaceId: string,
  attachmentId: string,
): Promise<AttachmentFile | null> {
  if (!objectIdSchema.safeParse(attachmentId).success) return null;
  await connectToDatabase();
  const a = await StrategyAttachment.findOne({ _id: attachmentId, workspaceId }).lean();
  if (!a) return null;
  const owner = await Strategy.exists({ _id: a.strategyId, workspaceId, ...READY });
  if (!owner) return null;
  try {
    const bytes = await getStorage().get(a.objectKey);
    return { bytes, contentType: a.contentType, originalName: a.originalName };
  } catch {
    return null; // missing object: treat as not found rather than leaking paths
  }
}
