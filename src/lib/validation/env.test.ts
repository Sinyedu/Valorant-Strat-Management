import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("getServerEnv", () => {
  it("accepts mongodb:// URIs", () => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017/vsmp");
    expect(getServerEnv().MONGODB_URI).toBe("mongodb://127.0.0.1:27017/vsmp");
  });

  it("accepts mongodb+srv:// URIs", () => {
    vi.stubEnv("MONGODB_URI", "mongodb+srv://u:p@cluster.example.net/vsmp");
    expect(getServerEnv().MONGODB_URI).toContain("mongodb+srv://");
  });

  it("rejects a missing URI", () => {
    vi.stubEnv("MONGODB_URI", "");
    expect(() => getServerEnv()).toThrow(/MONGODB_URI/);
  });

  it("rejects a non-mongodb scheme without echoing the value", () => {
    vi.stubEnv("MONGODB_URI", "postgres://user:secret@host/db");
    try {
      getServerEnv();
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toMatch(/MONGODB_URI/);
      expect((e as Error).message).not.toContain("secret");
    }
  });
});
