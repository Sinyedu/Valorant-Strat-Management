import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { User } from "@/server/models/user";
import { Workspace } from "@/server/models/workspace";
import { Folder } from "@/server/models/folder";

/** Integration tests run only when MONGODB_TEST_URI is set. */
export const testUri = process.env.MONGODB_TEST_URI;

/** Connects to the test database. Refuses any database whose name doesn't contain "test". */
export async function setupTestDb() {
  if (!testUri) throw new Error("MONGODB_TEST_URI is not set");
  process.env.MONGODB_URI = testUri;
  const conn = await connectToDatabase();
  const name = conn.connection.db?.databaseName ?? "";
  if (!name.includes("test")) {
    throw new Error(`Refusing to run against non-test database "${name}"`);
  }
  await conn.connection.db?.dropDatabase();
  await Promise.all([User.init(), Workspace.init(), Folder.init()]);
}

export async function teardownTestDb() {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
}
