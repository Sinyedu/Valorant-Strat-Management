// In-memory failure limiter. Per server instance only; replace with a shared
// store if the app is ever run on multiple instances.
type Entry = { failures: number; resetAt: number };
const entries = new Map<string, Entry>();

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;

export function isBlocked(key: string, now = Date.now()): boolean {
  const e = entries.get(key);
  if (!e) return false;
  if (e.resetAt <= now) {
    entries.delete(key);
    return false;
  }
  return e.failures >= MAX_FAILURES;
}

export function recordFailure(key: string, now = Date.now()): void {
  const e = entries.get(key);
  if (!e || e.resetAt <= now) {
    entries.set(key, { failures: 1, resetAt: now + WINDOW_MS });
  } else {
    e.failures += 1;
  }
  if (entries.size > 10_000) entries.clear(); // bound memory
}

export function clearFailures(key: string): void {
  entries.delete(key);
}
