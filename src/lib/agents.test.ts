import { readdirSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { AGENT_ICONS } from "./agents";

it("agent list matches the portraits in public/agents", () => {
  const files = readdirSync(path.resolve("public/agents")).filter((f) => f.endsWith(".webp"));
  expect(files.map((f) => f.replace(".webp", "")).sort()).toEqual([...AGENT_ICONS].sort());
});
