import { describe, expect, it } from "vitest";
import { MAP_BACKGROUNDS } from "./map-backgrounds";

const toPx = (id: string, x: number, y: number) => {
  const m = MAP_BACKGROUNDS[id];
  return [m.scale * x + m.offsetX, m.scale * y + m.offsetY];
};

describe("map calibration", () => {
  // File coordinates of each map's bomb element (from the sample) against the bomb
  // icon centre measured on that map's 3200x1800 Wingman image. Not circular: the
  // pixel centres come from the images, the coordinates from the .map file.
  it.each([
    ["ascent", 530, 680, 1438.5, 1544],
    ["summit", 582, 695, 1558, 1578.5],
    ["corrode", 600, 700, 1599.5, 1590],
  ])("%s bomb lands within 3px", (id, x, y, px, py) => {
    const [gx, gy] = toPx(id, x, y);
    expect(Math.abs(gx - px)).toBeLessThan(3);
    expect(Math.abs(gy - py)).toBeLessThan(3);
  });

  it("agents measured on the Ascent screenshot land within 6px", () => {
    const [cx, cy] = toPx("ascent", 398.6, 398.9); // chamber
    expect(Math.abs(cx - 1135)).toBeLessThan(6);
    expect(Math.abs(cy - 897)).toBeLessThan(6);
    const [sx, sy] = toPx("ascent", 775.9, 511.6); // sova
    expect(Math.abs(sx - 2005)).toBeLessThan(6);
    expect(Math.abs(sy - 1156)).toBeLessThan(6);
  });

  it.each(Object.entries(MAP_BACKGROUNDS))("%s crop lies inside the image", (_id, m) => {
    expect(m.crop.x).toBeGreaterThanOrEqual(0);
    expect(m.crop.y).toBeGreaterThanOrEqual(0);
    expect(m.crop.x + m.crop.w).toBeLessThanOrEqual(m.width);
    expect(m.crop.y + m.crop.h).toBeLessThanOrEqual(m.height);
  });
});
