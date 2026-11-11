import { describe, expect, it } from "vitest";
import {
  clearFailures,
  isBlocked,
  MAX_FAILURES,
  recordFailure,
  WINDOW_MS,
} from "./rate-limit";

describe("rate limit", () => {
  it("blocks after MAX_FAILURES and unblocks after the window", () => {
    const key = "a@example.com";
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure(key, t0);
    expect(isBlocked(key, t0)).toBe(false);
    recordFailure(key, t0);
    expect(isBlocked(key, t0)).toBe(true);
    expect(isBlocked(key, t0 + WINDOW_MS + 1)).toBe(false);
  });

  it("clears on success and is per key", () => {
    const t0 = 5_000_000;
    for (let i = 0; i < MAX_FAILURES; i++) recordFailure("x@example.com", t0);
    expect(isBlocked("y@example.com", t0)).toBe(false);
    clearFailures("x@example.com");
    expect(isBlocked("x@example.com", t0)).toBe(false);
  });
});
