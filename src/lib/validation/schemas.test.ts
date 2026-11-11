import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth";
import {
  folderNameSchema,
  objectIdSchema,
  optionalParentSchema,
} from "./folder";

describe("signupSchema", () => {
  it("normalizes email and accepts a valid signup", () => {
    const r = signupSchema.parse({ email: "  Foo@Example.COM ", password: "longenough" });
    expect(r.email).toBe("foo@example.com");
  });

  it("rejects short passwords and passwords over bcrypt's 72-byte limit", () => {
    expect(signupSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "a@b.co", password: "x".repeat(73) }).success).toBe(false);
  });

  it("rejects invalid emails", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("folder schemas", () => {
  it("validates ObjectIds strictly", () => {
    expect(objectIdSchema.safeParse("507f1f77bcf86cd799439011").success).toBe(true);
    expect(objectIdSchema.safeParse("not-an-id").success).toBe(false);
    expect(objectIdSchema.safeParse("123456789012").success).toBe(false); // 12-char strings are not accepted
  });

  it("trims names and rejects empty or oversized ones", () => {
    expect(folderNameSchema.parse("  Ascent  ")).toBe("Ascent");
    expect(folderNameSchema.safeParse("   ").success).toBe(false);
    expect(folderNameSchema.safeParse("x".repeat(101)).success).toBe(false);
  });

  it("maps an empty parent to null (root)", () => {
    expect(optionalParentSchema.parse("")).toBeNull();
    expect(optionalParentSchema.parse("507f1f77bcf86cd799439011")).toBe("507f1f77bcf86cd799439011");
    expect(optionalParentSchema.safeParse("junk").success).toBe(false);
  });
});
