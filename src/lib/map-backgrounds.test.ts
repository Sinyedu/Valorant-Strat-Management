import { describe, expect, it } from "vitest";
import { MAP_BACKGROUNDS } from "./map-backgrounds";

describe("ascent calibration", () => {
  const a = MAP_BACKGROUNDS.ascent;
  const toPx = (x: number, y: number) => [a.scale * x + a.offsetX, a.scale * y + a.offsetY];

  // Pixel centres measured on the 3200x1800 Wingman screenshot of the sample's first scene.
  it.each([
    ["bomb", 530, 680, 1438.5, 1544],
    ["chamber", 398.6, 398.9, 1135, 897],
    ["sova", 775.9, 511.6, 2005, 1156],
  ])("places %s within 6px", (_n, x, y, px, py) => {
    const [gx, gy] = toPx(x, y);
    expect(Math.abs(gx - px)).toBeLessThan(6);
    expect(Math.abs(gy - py)).toBeLessThan(6);
  });

  it("crop lies inside the image", () => {
    const c = a.crop;
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.y).toBeGreaterThanOrEqual(0);
    expect(c.x + c.w).toBeLessThanOrEqual(a.width);
    expect(c.y + c.h).toBeLessThanOrEqual(a.height);
  });
});
