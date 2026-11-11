import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { ImportError } from "@/server/import/types";
import { parseWingman } from "./parse";

const sample = new Uint8Array(readFileSync(path.resolve("sample/tactical-map-2026-11-11.map")));
const gz = (v: unknown) => new Uint8Array(gzipSync(JSON.stringify(v)));
const scene = (elements: unknown[]) => ({ id: "s1", name: "A", mapId: "ascent", isDefense: false, elements });
const file = (scenes: unknown[]) => ({ formatVersion: 2, mapId: "ascent", activeSceneId: "s1", scenes });
const parse = (b: Uint8Array) => parseWingman({ name: "x.map", bytes: b });

describe("parseWingman", () => {
  it("decodes the supplied sample", () => {
    const r = parse(sample);
    expect(r.scenes).toHaveLength(5);
    expect(r.result.frames.map((f) => f.kind)).toEqual(Array(5).fill("tactical-scene"));
    expect(r.scenes[0].elements.length).toBe(23);
    expect(r.scenes[0].unsupported).toEqual([]);
    expect(r.result.mapId).toBeUndefined(); // scenes mix maps, so no single map is claimed
    expect(r.scenes.map((s) => s.mapId)).toEqual(["ascent", "summit", "summit", "corrode", "free"]);
  });

  it("reports a shared map id", () => {
    const r = parse(gz(file([scene([]), scene([])])));
    expect(r.result.mapId).toBe("ascent");
  });

  it("degrades gracefully on unknown element types", () => {
    const r = parse(gz(file([scene([{ type: "laser", x: 1 }, { type: "laser" }])])));
    expect(r.scenes[0].unsupported).toEqual([{ type: "laser", count: 2 }]);
    expect(r.scenes[0].elements).toEqual([]);
  });

  it("drops unsafe colors", () => {
    const el = { type: "text", x: 1, y: 2, content: "hi", color: "url(javascript:1)", fontSize: 12 };
    const r = parse(gz(file([scene([el])])));
    expect(r.scenes[0].elements[0]).toMatchObject({ color: null });
  });

  it.each([
    ["empty", new Uint8Array()],
    ["not gzip", new TextEncoder().encode("{}")],
    ["bad json", new Uint8Array(gzipSync("nope"))],
    ["wrong version", gz({ ...file([scene([])]), formatVersion: 3 })],
    ["no scenes", gz(file([]))],
    ["bad known element", gz(file([scene([{ type: "pen", points: [] }])]))],
    ["non-finite coordinate", gz(file([scene([{ type: "bomb", x: "1", y: 2 }])]))],
  ])("rejects %s", (_n, bytes) => {
    expect(() => parse(bytes)).toThrow(ImportError);
  });

  it("rejects gzip bombs", () => {
    const big = new Uint8Array(gzipSync(Buffer.alloc(20 * 1024 * 1024, 32)));
    expect(() => parse(big)).toThrow(ImportError);
  });
});
