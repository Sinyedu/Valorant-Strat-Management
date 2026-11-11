import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "./types";

// <workspaceObjectId>/<uuid>. Keys are server-generated and validated on every use.
const KEY_RE = /^[a-f0-9]{24}\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

export function newObjectKey(workspaceId: string): string {
  const key = `${workspaceId}/${randomUUID()}`;
  if (!KEY_RE.test(key)) throw new Error("Invalid workspace id for storage key");
  return key;
}

/** Development storage on local disk. Swap for an S3-compatible provider in production. */
export class LocalFileStorage implements FileStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    if (!KEY_RE.test(key)) throw new Error("Invalid storage key");
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, bytes: Uint8Array): Promise<void> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes, { flag: "wx" }); // never overwrite: originals are immutable
  }

  async get(key: string): Promise<Uint8Array> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}
