import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ABILITY_ICONS, abilityIconSrc } from "./abilities";

describe("ability icons", () => {
  it("every listed icon exists on disk", () => {
    for (const id of ABILITY_ICONS) expect(existsSync(path.resolve("public/abilities", `${id}.webp`)), id).toBe(true);
  });

  it("covers every ability in the sample", () => {
    for (const id of [
      "yoru/gatecrash", "sage/slow_orb", "chamber/rendezvous", "chamber/trademark", "sova/recon_bolt",
      "omen/shrouded_step", "omen/dark_cover", "fade/prowler", "viper/toxic_screen", "viper/poison_cloud",
    ]) expect(ABILITY_ICONS.has(id), id).toBe(true);
  });

  it("returns null for unknown or missing ids", () => {
    expect(abilityIconSrc("sova", null)).toBeNull();
    expect(abilityIconSrc("sova", "../../etc/passwd")).toBeNull();
  });
});
