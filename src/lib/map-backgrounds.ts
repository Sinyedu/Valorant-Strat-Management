// Wingman scene coordinates -> background image pixels: px = scale * x + offsetX.
// Calibrated by hand, per map, from a Wingman screenshot (see README). A map is
// listed here only once its background and transform have been checked.
export type MapBackground = {
  src: string;
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  /** Area of the image worth showing (the map itself plus a margin), in image pixels. */
  crop: { x: number; y: number; w: number; h: number };
  note: string;
};

export const MAP_BACKGROUNDS: Record<string, MapBackground> = {
  ascent: {
    src: "/maps/ascent.png",
    width: 3200,
    height: 1800,
    scale: 2.303,
    offsetX: 217.9,
    offsetY: -22,
    crop: { x: 816, y: 69, w: 1568, h: 1663 },
    note: "calibrated from one Wingman scene",
  },
};
