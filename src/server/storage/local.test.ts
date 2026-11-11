import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalFileStorage, newObjectKey } from "./local";

const ws = "507f1f77bcf86cd799439011";
let root: string;
let storage: LocalFileStorage;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "vsmp-storage-"));
  storage = new LocalFileStorage(root);
});
afterAll(() => rm(root, { recursive: true, force: true }));

describe("LocalFileStorage", () => {
  it("round-trips bytes and deletes idempotently", async () => {
    const key = newObjectKey(ws);
    await storage.put(key, new Uint8Array([1, 2, 3]));
    expect(Array.from(await storage.get(key))).toEqual([1, 2, 3]);
    await storage.delete(key);
    await storage.delete(key); // second delete must not throw
    await expect(storage.get(key)).rejects.toThrow();
  });

  it("never overwrites an existing object", async () => {
    const key = newObjectKey(ws);
    await storage.put(key, new Uint8Array([1]));
    await expect(storage.put(key, new Uint8Array([2]))).rejects.toThrow();
    expect(Array.from(await storage.get(key))).toEqual([1]);
  });

  it("rejects keys that are not server-generated (path traversal)", async () => {
    const bad = ["../canary-vsmp", `${ws}/../../canary-vsmp`, "/etc/passwd", `${ws}/file.png`, "a/b", ""];
    for (const key of bad) {
      await expect(storage.get(key)).rejects.toThrow(/Invalid storage key/);
      await expect(storage.put(key, new Uint8Array([1]))).rejects.toThrow(/Invalid storage key/);
      await expect(storage.delete(key)).rejects.toThrow(/Invalid storage key/);
    }
    expect(await readdir(path.dirname(root)).then((l) => l.includes("canary-vsmp"))).toBe(false);
  });

  it("generates opaque keys scoped to the workspace", () => {
    const a = newObjectKey(ws);
    expect(a.startsWith(`${ws}/`)).toBe(true);
    expect(a).not.toBe(newObjectKey(ws));
    expect(() => newObjectKey("not-a-workspace")).toThrow();
  });
});
