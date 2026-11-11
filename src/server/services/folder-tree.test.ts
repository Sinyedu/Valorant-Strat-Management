import { describe, expect, it } from "vitest";
import { MAX_FOLDER_DEPTH, wouldCreateCycle } from "./folder-tree";

// a (root) <- b <- c <- d
const parents: Record<string, string | null> = { a: null, b: "a", c: "b", d: "c" };
const lookup = async (id: string) => parents[id];

describe("wouldCreateCycle", () => {
  it("allows moving to the root", async () => {
    expect(await wouldCreateCycle("c", null, lookup)).toBe(false);
  });

  it("rejects moving a folder into itself", async () => {
    expect(await wouldCreateCycle("b", "b", lookup)).toBe(true);
  });

  it("rejects moving a folder into a descendant", async () => {
    expect(await wouldCreateCycle("a", "d", lookup)).toBe(true);
    expect(await wouldCreateCycle("b", "c", lookup)).toBe(true);
  });

  it("allows moving into an unrelated branch or an ancestor", async () => {
    const withSibling = { ...parents, x: null };
    const get = async (id: string) => withSibling[id as keyof typeof withSibling];
    expect(await wouldCreateCycle("b", "x", get)).toBe(false);
    expect(await wouldCreateCycle("d", "a", get)).toBe(false);
  });

  it("stops when a parent does not exist", async () => {
    expect(await wouldCreateCycle("a", "ghost", async () => undefined)).toBe(false);
  });

  it("refuses when the chain is absurdly deep or corrupt (loops)", async () => {
    const loop = async (id: string) => (id === "p" ? "q" : "p");
    expect(await wouldCreateCycle("z", "p", loop)).toBe(true);
    expect(MAX_FOLDER_DEPTH).toBeGreaterThan(0);
  });
});
