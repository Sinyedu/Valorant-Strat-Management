import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// 1x1 transparent PNG.
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export const image = (name: string) => ({ name, mimeType: "image/png", buffer: PNG });

export async function signUp(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL("**/dashboard");
  return email;
}

/** Fails with a readable list of WCAG A/AA violations. */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n   ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join("\n   ")}`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

/** Opens the upload page from the current folder, picks PNGs, and saves. */
export async function uploadImages(page: Page, names: string[], group: boolean) {
  await page.getByRole("link", { name: "Upload strategies" }).click();
  await page.locator('input[type="file"]').setInputFiles(names.map(image));
  if (group) await page.getByLabel(/Group all/).check();
  await page.getByRole("button", { name: /^Save/ }).click();
}
