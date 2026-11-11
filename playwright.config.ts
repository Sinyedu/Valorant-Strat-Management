import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// The tests create real accounts and uploads, so they must never touch real data.
const uri = process.env.E2E_MONGODB_URI;
if (!uri) {
  throw new Error("Set E2E_MONGODB_URI to a throwaway database whose name contains e2e.");
}
const dbName = uri.split("?")[0].split("/").pop() ?? "";
if (!dbName.includes("e2e")) {
  throw new Error(`Refusing to run E2E against database "${dbName}": its name must contain "e2e".`);
}

const PORT = 3150;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      MONGODB_URI: uri,
      AUTH_SECRET: process.env.AUTH_SECRET || "e2e-only-secret-not-used-anywhere-else-0123456789",
      AUTH_TRUST_HOST: "true",
      STORAGE_DIR: mkdtempSync(path.join(tmpdir(), "vsmp-e2e-")),
    },
  },
});
