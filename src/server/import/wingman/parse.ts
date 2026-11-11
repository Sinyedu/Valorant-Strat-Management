import { gunzipSync } from "node:zlib";
import { safeDisplayName, titleFromFilename } from "@/server/import/filename";
import { ImportError, type ImportResult } from "@/server/import/types";
import type { SceneDto, SceneElement } from "@/types/scene";
import { wingmanFile } from "./schema";

export const MAX_MAP_BYTES = 5 * 1024 * 1024;
const MAX_JSON_BYTES = 8 * 1024 * 1024; // decompressed; keeps each frame document far below 16 MiB
const SAFE_ID = /^[a-z0-9_-]{1,40}$/i;
const SAFE_COLOR = /^#[0-9a-f]{3,8}$/i;

const color = (c: string | null | undefined) => (c && SAFE_COLOR.test(c) ? c : null);
const mapIdOf = (m: string | null | undefined) => (m && SAFE_ID.test(m) ? m.toLowerCase() : null);
const clean = (s: string | null | undefined) => s?.trim() || null;

function decode(bytes: Uint8Array, name: string): unknown {
  if (bytes.length === 0) throw new ImportError(`${name}: file is empty`);
  if (bytes.length > MAX_MAP_BYTES) throw new ImportError(`${name}: larger than ${MAX_MAP_BYTES / 1024 / 1024} MB`);
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) throw new ImportError(`${name}: not a Wingman .map file (not gzip)`);
  let json: string;
  try {
    json = gunzipSync(bytes, { maxOutputLength: MAX_JSON_BYTES }).toString("utf8");
  } catch {
    throw new ImportError(`${name}: corrupt or too large to import`);
  }
  try {
    return JSON.parse(json);
  } catch {
    throw new ImportError(`${name}: not a Wingman .map file (invalid JSON)`);
  }
}

type Parsed = ReturnType<typeof wingmanFile.parse>["scenes"][number];

function normalizeScene(s: Parsed): SceneDto {
  const elements: SceneElement[] = [];
  const unsupported = new Map<string, number>();
  for (const e of s.elements) {
    if (e.type === "unsupported") {
      unsupported.set(e.name, (unsupported.get(e.name) ?? 0) + 1);
    } else if (e.type === "character") {
      elements.push({ type: "character", characterId: e.characterId, x: e.x, y: e.y, rotation: e.rotation, coneAngle: e.coneAngle ?? null });
    } else if (e.type === "ability") {
      elements.push({ type: "ability", characterId: e.characterId, abilityId: e.abilityId ?? null, x: e.x, y: e.y, rotation: e.rotation, color: color(e.color) });
    } else if (e.type === "pen" || e.type === "freehand") {
      elements.push({ type: e.type, points: e.points, color: color(e.color), closed: e.closed, dotted: e.dotted, arrowEnd: e.arrowEnd });
    } else if (e.type === "text") {
      elements.push({ type: "text", x: e.x, y: e.y, content: e.content, color: color(e.color), fontSize: e.fontSize });
    } else {
      elements.push({ type: "bomb", x: e.x, y: e.y });
    }
  }
  return {
    name: s.name,
    mapId: mapIdOf(s.mapId),
    isDefense: s.isDefense,
    headerText: clean(s.headerText),
    headerSubtext: clean(s.headerSubtext),
    elements,
    unsupported: [...unsupported].map(([type, count]) => ({ type, count })),
  };
}

export type ParsedWingman = {
  originalName: string;
  result: ImportResult;
  scenes: SceneDto[];
};

/** Decodes, validates, and normalizes a Wingman `.map` (gzip + JSON, formatVersion 2). */
export function parseWingman(file: { name: string; bytes: Uint8Array }): ParsedWingman {
  const originalName = safeDisplayName(file.name);
  const raw = decode(file.bytes, originalName);
  const parsed = wingmanFile.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path.length ? ` (${issue.path.join(".")})` : "";
    throw new ImportError(`${originalName}: unsupported or invalid Wingman data${where}: ${issue.message}`);
  }
  const scenes = parsed.data.scenes.map(normalizeScene);
  // Only trust a map id when every scene agrees; the sample mixes maps across scenes.
  const maps = new Set(scenes.map((s) => s.mapId));
  const [only] = [...maps];
  return {
    originalName,
    scenes,
    result: {
      suggestedTitle: titleFromFilename(originalName),
      mapId: maps.size === 1 && only ? only : undefined,
      frames: scenes.map((s, order) => ({
        order,
        kind: "tactical-scene",
        name: (s.headerText ?? s.name).slice(0, 100),
        previewData: s,
      })),
    },
  };
}
