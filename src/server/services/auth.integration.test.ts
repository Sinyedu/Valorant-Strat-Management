import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupTestDb, teardownTestDb, testUri } from "@/test/db";
import { registerUser, SignupError, verifyCredentials } from "./auth";
import { User } from "@/server/models/user";
import { Workspace } from "@/server/models/workspace";

describe.skipIf(!testUri)("auth service (MongoDB)", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);

  it("registers a user with a hashed password and a personal workspace", async () => {
    await registerUser({ email: "Ana@Example.com", password: "correct-horse" });
    const user = await User.findOne({ email: "ana@example.com" }).lean();
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toContain("correct-horse");
    expect(await Workspace.countDocuments({ ownerId: user!._id })).toBe(1);
  });

  it("rejects a duplicate email regardless of case", async () => {
    await expect(
      registerUser({ email: "ANA@example.com", password: "another-pass" }),
    ).rejects.toBeInstanceOf(SignupError);
  });

  it("verifies correct credentials and returns the workspace id", async () => {
    const u = await verifyCredentials("ana@example.com", "correct-horse");
    expect(u?.email).toBe("ana@example.com");
    expect(u?.workspaceId).toMatch(/^[a-f0-9]{24}$/);
  });

  it("rejects a wrong password and an unknown email", async () => {
    expect(await verifyCredentials("ana@example.com", "wrong-pass")).toBeNull();
    expect(await verifyCredentials("nobody@example.com", "whatever")).toBeNull();
  });
});
