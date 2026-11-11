import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { setupTestDb, teardownTestDb, testUri } from "@/test/db";
import {
  createFolder,
  deleteFolder,
  FolderError,
  getBreadcrumbs,
  getFolder,
  listChildren,
  moveFolder,
  renameFolder,
} from "./folders";

const wsA = new Types.ObjectId().toString();
const wsB = new Types.ObjectId().toString();

async function make(ws: string, parent: string | null, name: string) {
  await createFolder(ws, parent, name);
  const rows = await listChildren(ws, parent);
  return rows.find((f) => f.name === name)!.id;
}

describe.skipIf(!testUri)("folder service (MongoDB)", () => {
  let maps: string, ascent: string, attack: string, other: string;

  beforeAll(async () => {
    await setupTestDb();
    maps = await make(wsA, null, "Maps");
    ascent = await make(wsA, maps, "Ascent");
    attack = await make(wsA, ascent, "Attack");
    other = await make(wsB, null, "B's folder");
  });
  afterAll(teardownTestDb);

  it("lists children and builds breadcrumbs", async () => {
    expect((await listChildren(wsA, null)).map((f) => f.name)).toEqual(["Maps"]);
    const trail = await getBreadcrumbs(wsA, attack);
    expect(trail.map((f) => f.name)).toEqual(["Maps", "Ascent", "Attack"]);
  });

  it("rejects duplicate sibling names but allows the same name elsewhere", async () => {
    await expect(createFolder(wsA, maps, "Ascent")).rejects.toBeInstanceOf(FolderError);
    await expect(createFolder(wsA, null, "Ascent")).resolves.toBeUndefined();
  });

  it("refuses moves into itself or a descendant", async () => {
    await expect(moveFolder(wsA, maps, maps)).rejects.toThrow(/itself/);
    await expect(moveFolder(wsA, maps, attack)).rejects.toThrow(/itself/);
  });

  it("moves a folder to the root and back", async () => {
    await moveFolder(wsA, attack, null);
    expect((await getFolder(wsA, attack))?.parentFolderId).toBeNull();
    await moveFolder(wsA, attack, ascent);
    expect((await getFolder(wsA, attack))?.parentFolderId).toBe(ascent);
  });

  it("isolates workspaces: no reads, writes, or cross-workspace parents", async () => {
    expect(await getFolder(wsB, maps)).toBeNull();
    expect(await listChildren(wsB, maps)).toEqual([]);
    await expect(renameFolder(wsB, maps, "hijack")).rejects.toThrow(/not found/);
    await expect(deleteFolder(wsB, maps)).rejects.toThrow(/not found/);
    await expect(moveFolder(wsA, maps, other)).rejects.toThrow(/not found/);
    await expect(createFolder(wsB, maps, "sneaky")).rejects.toThrow(/not found/);
    expect((await getFolder(wsA, maps))?.name).toBe("Maps");
  });

  it("renames, refuses deleting non-empty folders, deletes empty ones", async () => {
    await renameFolder(wsA, attack, "Attack side");
    expect((await getFolder(wsA, attack))?.name).toBe("Attack side");
    await expect(deleteFolder(wsA, ascent)).rejects.toThrow(/not empty/);
    await deleteFolder(wsA, attack);
    expect(await getFolder(wsA, attack)).toBeNull();
  });

  it("treats malformed ids as not found", async () => {
    expect(await getFolder(wsA, "not-an-id")).toBeNull();
    await expect(renameFolder(wsA, "not-an-id", "x")).rejects.toBeInstanceOf(FolderError);
  });
});
