import "server-only";
import path from "node:path";
import { LocalFileStorage } from "./local";
import type { FileStorage } from "./types";

let storage: FileStorage | undefined;

/** STORAGE_DIR is private server-side disk storage; defaults to ./.storage (git-ignored). */
export function getStorage(): FileStorage {
  storage ??= new LocalFileStorage(
    process.env.STORAGE_DIR || path.join(process.cwd(), ".storage"),
  );
  return storage;
}
