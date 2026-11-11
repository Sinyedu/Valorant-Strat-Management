import { z } from "zod";

export const MAX_SCENES = 50;
export const MAX_ELEMENTS = 5000;
export const MAX_POINTS = 5000;

const num = z.number().finite();
const id = z.string().min(1).max(100);
const point = z.object({ x: num, y: num });
const common = { x: num, y: num };

// Known element types are validated strictly; unknown types fall through to `other`.
const character = z.object({
  type: z.literal("character"),
  characterId: id,
  rotation: num.default(0),
  coneAngle: num.nullish(),
  ...common,
});
const ability = z.object({
  type: z.literal("ability"),
  characterId: id,
  abilityId: id.nullish(),
  rotation: num.default(0),
  color: z.string().max(40).nullish(),
  ...common,
});
const strokeShape = z.object({
    points: z.array(point).min(1).max(MAX_POINTS),
    color: z.string().max(40).nullish(),
    closed: z.boolean().default(false),
    dotted: z.boolean().default(false),
    arrowEnd: z.boolean().default(false),
  });
const pen = strokeShape.extend({ type: z.literal("pen") });
const freehand = strokeShape.extend({ type: z.literal("freehand") });
const text = z.object({
  type: z.literal("text"),
  content: z.string().max(2000),
  color: z.string().max(40).nullish(),
  fontSize: num.min(1).max(500).default(16),
  ...common,
});
const bomb = z.object({ type: z.literal("bomb"), ...common });
const other = z.object({ type: z.string().min(1).max(60) });

export const knownElement = z.discriminatedUnion("type", [
  character,
  ability,
  pen,
  freehand,
  text,
  bomb,
]);
const KNOWN = new Set(["character", "ability", "pen", "freehand", "text", "bomb"]);

/** Validates strictly when the type is known, loosely (type only) otherwise. */
export const element = z.unknown().transform((v, ctx) => {
  const t = other.safeParse(v);
  if (!t.success) {
    ctx.addIssue({ code: "custom", message: "element without a type" });
    return z.NEVER;
  }
  if (!KNOWN.has(t.data.type)) return { type: "unsupported" as const, name: t.data.type };
  const k = knownElement.safeParse(v);
  if (!k.success) {
    ctx.addIssue({ code: "custom", message: `invalid ${t.data.type} element` });
    return z.NEVER;
  }
  return k.data;
});

export const scene = z.object({
  id: id,
  name: z.string().max(200),
  mapId: z.string().max(60).nullish(),
  isDefense: z.boolean().default(false),
  headerText: z.string().max(500).nullish(),
  headerSubtext: z.string().max(500).nullish(),
  elements: z.array(element).max(MAX_ELEMENTS),
});

export const wingmanFile = z.object({
  formatVersion: z.literal(2),
  mapId: z.string().max(60).nullish(),
  activeSceneId: z.string().max(100).nullish(),
  scenes: z.array(scene).min(1).max(MAX_SCENES),
});
