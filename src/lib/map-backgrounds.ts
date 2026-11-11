// Wingman scene coordinates -> background image pixels: px = SCALE * x + OFFSET_X.
// Measured on Wingman screenshots (see README). The same transform fits Ascent,
// Summit and Corrode to within 1 px (checked with the bomb element of each map),
// so it is shared. Maps whose own check has not been done are flagged `verified: false`.
export const SCALE = 2.303;
export const OFFSET_X = 217.9;
export const OFFSET_Y = -22;
const IMAGE = { width: 3200, height: 1800 } as const;

export type MapBackground = {
  src: string;
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  /** Area of the image worth showing (the map plus a margin), in image pixels. */
  crop: { x: number; y: number; w: number; h: number };
  /** True once this map's own bomb (or other element) was matched against its image. */
  verified: boolean;
  note: string;
};

const map = (
  id: string,
  crop: [x: number, y: number, w: number, h: number],
  verified: boolean,
): [string, MapBackground] => [
  id,
  {
    src: `/maps/${id}.png`,
    ...IMAGE,
    scale: SCALE,
    offsetX: OFFSET_X,
    offsetY: OFFSET_Y,
    crop: { x: crop[0], y: crop[1], w: crop[2], h: crop[3] },
    verified,
    note: verified
      ? "position checked against the Wingman sample"
      : "shared transform, not yet checked on this map",
  },
];

// Crops come from each image's non-background extents plus an 80 px margin.
export const MAP_BACKGROUNDS: Record<string, MapBackground> = Object.fromEntries([
  map("ascent", [816, 69, 1568, 1663], true),
  map("summit", [776, 72, 1644, 1656], true),
  map("corrode", [852, 68, 1488, 1664], true),
  map("icebox", [848, 60, 1504, 1680], false),
  map("bind", [904, 80, 1404, 1636], false),
  map("haven", [840, 60, 1520, 1680], false),
  map("breeze", [756, 72, 1684, 1656], false),
  map("fracture", [736, 72, 1728, 1652], false),
  map("lotus", [692, 88, 1812, 1624], false),
  map("abyss", [748, 76, 1700, 1644], false),
  map("sunset", [816, 76, 1568, 1648], false),
  map("pearl", [768, 68, 1716, 1664], false),
  map("split", [724, 76, 1752, 1648], false),
]);
