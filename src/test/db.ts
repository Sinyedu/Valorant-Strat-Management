import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { User } from "@/server/models/user";
import { Workspace } from "@/server/models/workspace";
import { Folder } from "@/server/models/folder";
import { Strategy } from "@/server/models/strategy";
import { StrategyAttachment } from "@/server/models/strategy-attachment";
import { StrategyFrame } from "@/server/models/strategy-frame";

/** Integration tests run only when MONGODB_TEST_URI is set. */
export const testUri = process.env.MONGODB_TEST_URI;

export let storageDir = "";

/** Swaps the database name in a mongodb:// URI. */
const withDb = (uri: string, db: string) => {
  const hostEnd = uri.indexOf("/", uri.indexOf("://") + 3);
  const query = uri.indexOf("?", hostEnd);
  return uri.slice(0, hostEnd + 1) + db + (query === -1 ? "" : uri.slice(query));
};

/**
 * Connects to a fresh, uniquely named test database (one per test file, so files
 * never share or race on state). Refuses any database whose name lacks "test".
 */
export async function setupTestDb() {
  if (!testUri) throw new Error("MONGODB_TEST_URI is not set");
  process.env.MONGODB_URI = withDb(testUri, `vsmp_test_${randomUUID().slice(0, 8)}`);
  storageDir = await mkdtemp(path.join(tmpdir(), "vsmp-test-"));
  process.env.STORAGE_DIR = storageDir;
  const conn = await connectToDatabase();
  const name = conn.connection.db?.databaseName ?? "";
  if (!name.includes("test")) {
    throw new Error(`Refusing to run against non-test database "${name}"`);
  }
  await Promise.all(
    [User, Workspace, Folder, Strategy, StrategyAttachment, StrategyFrame].map((m) => m.init()),
  );
}

export async function teardownTestDb() {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
  if (storageDir) await rm(storageDir, { recursive: true, force: true });
}
