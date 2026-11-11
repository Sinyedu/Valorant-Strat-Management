import { test } from "@playwright/test";
import { expectNoA11yViolations, image, signUp } from "./helpers";

test.describe("axe: no WCAG A/AA violations", () => {
  for (const path of ["/", "/login", "/signup"]) {
    test(`public page ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectNoA11yViolations(page);
    });
  }

  test("signed-in pages: dashboard, folder, upload, strategy", async ({ page }) => {
    await signUp(page);
    await expectNoA11yViolations(page); // empty dashboard

    await page.getByLabel("New folder name").fill("Ascent");
    await page.getByRole("button", { name: "Create folder" }).click();
    await page.getByRole("link", { name: /Ascent/ }).click();
    await page.waitForURL("**/dashboard/folders/*");
    await expectNoA11yViolations(page); // empty folder

    await page.getByRole("link", { name: "Upload strategies" }).click();
    await page.locator('input[type="file"]').setInputFiles([image("a.png"), image("b.png")]);
    await expectNoA11yViolations(page); // upload page with thumbnails

    await page.getByLabel(/Group all/).check();
    await page.getByRole("button", { name: /^Save/ }).click();
    await page.waitForURL("**/dashboard/strategies/*");
    await expectNoA11yViolations(page); // strategy viewer

    await page.getByRole("link", { name: /Back to folder/ }).click();
    await page.waitForURL("**/dashboard/folders/*");
    await expectNoA11yViolations(page); // folder listing a strategy
  });
});
