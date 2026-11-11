import { describe, expect, it } from "vitest";
import { STRATEGY_SOURCES } from "./strategy";

describe("STRATEGY_SOURCES", () => {
  it("matches the sources defined in AGENTS.md", () => {
    expect([...STRATEGY_SOURCES]).toEqual([
      "wingman",
      "tactival",
      "valoplant",
      "generic",
    ]);
  });
});
