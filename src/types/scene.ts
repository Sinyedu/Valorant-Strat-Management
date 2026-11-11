// Normalized, client-safe representation of one Wingman scene. Only primitives we
// can draw faithfully are listed; everything else is counted in `unsupported`.
export type ScenePoint = { x: number; y: number };

export type SceneElement =
  | { type: "character"; characterId: string; x: number; y: number; rotation: number; coneAngle: number | null }
  | { type: "ability"; characterId: string; abilityId: string | null; x: number; y: number; rotation: number; color: string | null }
  | { type: "pen" | "freehand"; points: ScenePoint[]; color: string | null; closed: boolean; dotted: boolean; arrowEnd: boolean }
  | { type: "text"; x: number; y: number; content: string; color: string | null; fontSize: number }
  | { type: "bomb"; x: number; y: number };

export type SceneDto = {
  name: string;
  mapId: string | null;
  isDefense: boolean;
  headerText: string | null;
  headerSubtext: string | null;
  elements: SceneElement[];
  /** Element types present in the source that this viewer cannot draw. */
  unsupported: { type: string; count: number }[];
};
