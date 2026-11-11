import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import { setupTestDb, storageDir, teardownTestDb, testUri } from "@/test/db";
import { Strategy } from "@/server/models/strategy";
import { StrategyAttachment } from "@/server/models/strategy-attachment";
import { StrategyFrame } from "@/server/models/strategy-frame";
import { getStorage } from "@/server/storage";
import { createFolder, deleteFolder, listChildren } from "./folders";
import { importImages, MAX_FILES_PER_IMPORT } from "./strategy-import";
import { importWingman } from "./strategy-import-wingman";
import {
  deleteStrategy,
  getAttachmentFile,
  getStrategyDetail,
  listStrategies,
  renameStrategy,
  StrategyError,
} from "./strategies";

const wsA = new Types.ObjectId().toString();
const wsB = new Types.ObjectId().toString();

// Signature bytes are all the importer checks; the rest is padding.
const png = (n = 0) =>
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, n, n, n]);
const file = (name: string, n = 0) => ({ name, bytes: png(n) });

async function storedFiles(ws: string): Promise<string[]> {
  try {
    return await readdir(path.join(storageDir, ws));
  } catch {
    return [];
  }
}
const counts = () =>
  Promise.all([
    Strategy.countDocuments({ workspaceId: wsA }),
    StrategyAttachment.countDocuments({ workspaceId: wsA }),
    StrategyFrame.countDocuments({ workspaceId: wsA }),
  ]);

describe.skipIf(!testUri)("strategy import and access (MongoDB)", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);

  it("saves one strategy per image by default, titled from the filename", async () => {
    const ids = await importImages(wsA, {
      folderId: null,
      source: "tactival",
      group: false,
      files: [file("Ascent A execute.png", 1), file("Ascent B retake.PNG", 2)],
    });
    expect(ids).toHaveLength(2);
    const list = await listStrategies(wsA, null);
    expect(list.map((s) => s.title).sort()).toEqual(["Ascent A execute", "Ascent B retake"]);
    expect(list.every((s) => s.source === "tactival" && s.mapId === null)).toBe(true);
  });

  it("imports the Wingman sample as one strategy with a frame per scene", async () => {
    const bytes = new Uint8Array(readFileSync(path.resolve("sample/tactical-map-2026-11-11.map")));
    const id = await importWingman(wsA, { folderId: null, file: { name: "tactical-map-2026-11-11.map", bytes } });
    const d = await getStrategyDetail(wsA, id);
    expect(d?.strategy.source).toBe("wingman");
    expect(d?.strategy.title).toBe("tactical-map-2026-11-11");
    expect(d?.frames).toHaveLength(5);
    expect(d?.frames.every((f) => f.scene && f.scene.elements.length > 0)).toBe(true);
    const stored = await getAttachmentFile(wsA, d!.attachments[0].id);
    expect(Array.from(stored!.bytes)).toEqual(Array.from(bytes));
    await expect(
      importWingman(wsA, { folderId: null, file: { name: "x.map", bytes: new Uint8Array([1, 2]) } }),
    ).rejects.toThrow();
    await expect(
      importWingman(wsB, { folderId: new Types.ObjectId().toString(), file: { name: "a.map", bytes } }),
    ).rejects.toThrow(/Folder not found/);
  });

  it("groups images into one ordered strategy", async () => {
    const folder = await makeFolder("Grouped");
    const [id] = await importImages(wsA, {
      folderId: folder,
      source: "valoplant",
      group: true,
      files: [file("one.png", 1), file("two.png", 2), file("three.png", 3)],
    });
    const d = await getStrategyDetail(wsA, id);
    expect(d?.frames.map((f) => f.order)).toEqual([0, 1, 2]);
    expect(d?.frames.map((f) => f.name)).toEqual(["one", "two", "three"]);
    expect(d?.attachments).toHaveLength(3);
    expect(d?.strategy.title).toBe("one");
  });

  it("preserves the original bytes and detects type from content, not name", async () => {
    const original = png(9);
    const [id] = await importImages(wsA, {
      folderId: null,
      source: "generic",
      group: false,
      files: [{ name: "liar.jpg", bytes: original }],
    });
    const d = await getStrategyDetail(wsA, id);
    const stored = await getAttachmentFile(wsA, d!.attachments[0].id);
    expect(stored?.contentType).toBe("image/png");
    expect(Array.from(stored!.bytes)).toEqual(Array.from(original));
    expect(stored?.originalName).toBe("liar.jpg");
  });

  it("rejects bad input and writes nothing", async () => {
    const before = await counts();
    const filesBefore = (await storedFiles(wsA)).length;
    const bad = [
      { source: "tactival", files: [{ name: "a.png", bytes: new Uint8Array([1, 2, 3]) }] },
      { source: "tactival", files: [{ name: "a.png", bytes: new Uint8Array() }] },
      { source: "wingman", files: [file("a.png")] }, // images are not a Wingman source
      { source: "nope", files: [file("a.png")] },
      { source: "tactival", files: [] },
      { source: "tactival", files: [file("ok.png"), { name: "x.txt", bytes: new Uint8Array([65]) }] },
      {
        source: "tactival",
        files: Array.from({ length: MAX_FILES_PER_IMPORT + 1 }, (_, i) => file(`f${i}.png`, i)),
      },
    ];
    for (const b of bad) {
      await expect(
        importImages(wsA, { folderId: null, group: false, ...b }),
      ).rejects.toThrow();
    }
    expect(await counts()).toEqual(before);
    expect((await storedFiles(wsA)).length).toBe(filesBefore);
  });

  it("rejects a folder from another workspace or a malformed folder id", async () => {
    const foreign = await makeFolder("Foreign", wsB);
    for (const folderId of [foreign, "not-an-id", new Types.ObjectId().toString()]) {
      await expect(
        importImages(wsA, { folderId, source: "generic", group: false, files: [file("a.png")] }),
      ).rejects.toThrow(/Folder not found/);
    }
  });

  it("cleans up documents and stored files when a write fails midway", async () => {
    const before = await counts();
    const filesBefore = (await storedFiles(wsA)).length;
    const storage = getStorage();
    const real = storage.put.bind(storage);
    let calls = 0;
    const spy = vi.spyOn(storage, "put").mockImplementation(async (k, b, t) => {
      if (++calls === 2) throw new Error("disk full");
      return real(k, b, t);
    });
    await expect(
      importImages(wsA, {
        folderId: null,
        source: "generic",
        group: true,
        files: [file("a.png", 1), file("b.png", 2), file("c.png", 3)],
      }),
    ).rejects.toThrow("disk full");
    spy.mockRestore();
    expect(await counts()).toEqual(before);
    expect((await storedFiles(wsA)).length).toBe(filesBefore);
  });

  it("hides strategies that are still processing", async () => {
    const s = await Strategy.create({
      workspaceId: wsA, folderId: null, source: "generic", title: "half-imported", status: "processing",
    });
    expect((await listStrategies(wsA, null)).some((x) => x.title === "half-imported")).toBe(false);
    expect(await getStrategyDetail(wsA, String(s._id))).toBeNull();
    await Strategy.deleteOne({ _id: s._id });
  });

  it("isolates workspaces for reads, downloads, renames, and deletes", async () => {
    const [id] = await importImages(wsA, {
      folderId: null, source: "generic", group: false, files: [file("secret.png", 7)],
    });
    const d = await getStrategyDetail(wsA, id);
    expect(await getStrategyDetail(wsB, id)).toBeNull();
    expect(await getAttachmentFile(wsB, d!.attachments[0].id)).toBeNull();
    expect((await listStrategies(wsB, null)).length).toBe(0);
    await expect(renameStrategy(wsB, id, "hijack")).rejects.toBeInstanceOf(StrategyError);
    await expect(deleteStrategy(wsB, id)).rejects.toBeInstanceOf(StrategyError);
    expect((await getStrategyDetail(wsA, id))?.strategy.title).toBe("secret");
    expect(await getAttachmentFile(wsA, "not-an-id")).toBeNull();
  });

  it("renames, and deletes a strategy together with its stored files", async () => {
    const [id] = await importImages(wsA, {
      folderId: null, source: "generic", group: false, files: [file("temp.png", 5)],
    });
    await renameStrategy(wsA, id, "  Renamed  ");
    const d = await getStrategyDetail(wsA, id);
    expect(d?.strategy.title).toBe("Renamed");
    await expect(renameStrategy(wsA, id, "   ")).rejects.toBeInstanceOf(StrategyError);

    const filesBefore = (await storedFiles(wsA)).length;
    await deleteStrategy(wsA, id);
    expect(await getStrategyDetail(wsA, id)).toBeNull();
    expect(await getAttachmentFile(wsA, d!.attachments[0].id)).toBeNull();
    expect((await storedFiles(wsA)).length).toBe(filesBefore - 1);
  });

  it("refuses to delete a folder that contains strategies", async () => {
    const folder = await makeFolder("Has strategies");
    const [id] = await importImages(wsA, {
      folderId: folder, source: "generic", group: false, files: [file("in-folder.png", 4)],
    });
    await expect(deleteFolder(wsA, folder)).rejects.toThrow(/not empty/);
    await deleteStrategy(wsA, id);
    await expect(deleteFolder(wsA, folder)).resolves.toBeUndefined();
  });
});

async function makeFolder(name: string, ws = wsA): Promise<string> {
  await createFolder(ws, null, name);
  return (await listChildren(ws, null)).find((f) => f.name === name)!.id;
}
