// Normalized, client-safe representation of one Wingman scene. Only primitives we
// can draw faithfully are listed; everything else is counted in `unsupported`.
export type ScenePoint = { x: number; y: number };

/** Wingman draws element sizes at stored size x drawScale; 1.1 is its default (measured). */
export const DEFAULT_DRAW_SCALE = 1.1;

export type SceneElement =
  | { type: "character"; characterId: string; x: number; y: number; rotation: number; coneAngle: number | null }
  | {
      type: "ability";
      characterId: string;
      abilityId: string | null;
      x: number;
      y: number;
      rotation: number;
      color: string | null;
      // Optional: scenes imported before these existed lack them.
      altIcon?: boolean; // Wingman's alt-icon toggle
      scale?: number; // drawScale multiplier for iconSize/radius
      iconSize?: number | null;
      radius?: number | null; // only set when Wingman shows the radius ring
      radiusHover?: number | null; // range ring Wingman shows on hover
      line?: ScenePoint[] | null; // line abilities (walls, screens)
      iconT?: number | null; // icon position along the line, 0..1
    }
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
