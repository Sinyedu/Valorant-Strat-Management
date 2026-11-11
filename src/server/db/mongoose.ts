import "server-only";
import mongoose from "mongoose";
import { getServerEnv } from "@/lib/validation/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Cache on globalThis so dev hot reloads don't open a new connection each time.
const globalForMongoose = globalThis as unknown as {
  mongooseCache?: MongooseCache;
};
const cache: MongooseCache = (globalForMongoose.mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const { MONGODB_URI } = getServerEnv();
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      })
      .catch((error: unknown) => {
        // Reset so the next call can retry. Log only the error name: driver
        // messages may include the connection string.
        cache.promise = null;
        const name = error instanceof Error ? error.name : "UnknownError";
        console.error(`MongoDB connection failed (${name})`);
        throw new Error("Database connection failed");
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
