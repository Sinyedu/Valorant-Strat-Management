import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Guards WCAG 1.4.3 / 1.4.11 for the design tokens. axe does not check non-text
// contrast (such as input borders), so these ratios are asserted directly.
const css = readFileSync(path.join(__dirname, "globals.css"), "utf8");
const token = (name: string): string => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`Token --${name} not found in globals.css`);
  return m[1];
};

const channel = (hex: string, i: number) => {
  const v = parseInt(hex.slice(i, i + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("colour token contrast", () => {
  const bg = token("background");
  const surface = token("surface");

  it("text colours meet 4.5:1 on the background and on cards", () => {
    for (const name of ["foreground", "muted", "accent"]) {
      expect(ratio(token(name), bg), `${name} on background`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(token(name), surface), `${name} on surface`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("primary buttons (page background colour on the accent) meet 4.5:1", () => {
    expect(ratio(bg, token("accent"))).toBeGreaterThanOrEqual(4.5);
  });

  it("form field borders meet 3:1 on the background and on cards", () => {
    expect(ratio(token("field"), bg)).toBeGreaterThanOrEqual(3);
    expect(ratio(token("field"), surface)).toBeGreaterThanOrEqual(3);
  });
});
