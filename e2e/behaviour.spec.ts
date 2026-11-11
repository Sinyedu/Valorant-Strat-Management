import { expect, test } from "@playwright/test";
import { signUp, uploadImages } from "./helpers";

test("landing page sends signed-out visitors to sign up, signed-in users to the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/signup");
  await signUp(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Open dashboard" })).toBeVisible();
});

test("skip link is the first focusable element", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});

test("the file chooser shows a visible focus indicator for keyboard users", async ({ page }) => {
  await signUp(page);
  await page.getByRole("link", { name: "Upload strategies" }).click();
  await page.locator('input[type="file"]').focus();
  const outline = await page
    .locator("label:has(input[type=file])")
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

test("layout does not scroll sideways at 320px (reflow)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await signUp(page);
  for (const path of ["/dashboard", "/dashboard/upload"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
  }
});

test("frame viewer keeps keyboard focus on Next at the last frame and announces the position", async ({ page }) => {
  await signUp(page);
  await uploadImages(page, ["one.png", "two.png"], true);
  await page.waitForURL("**/dashboard/strategies/*");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("one");
  const next = page.getByRole("button", { name: /Next/ });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Frame 2 of 2" })).toBeVisible();
  await page.keyboard.press("Enter"); // already at the end
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute("aria-disabled", "true");
});

test("deleting a strategy needs confirmation and can be cancelled", async ({ page }) => {
  await signUp(page);
  await uploadImages(page, ["gone.png"], false);
  await page.waitForURL("**/dashboard/strategies/*");
  await page.getByRole("button", { name: "Delete strategy" }).click();
  await expect(page.getByText(/cannot be undone/)).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "Delete strategy" })).toBeVisible();

  await page.getByRole("button", { name: "Delete strategy" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("link", { name: "gone" })).toHaveCount(0);
});

test("folder controls have unique accessible names", async ({ page }) => {
  await signUp(page);
  await page.getByLabel("New folder name").fill("Bind");
  await page.getByRole("button", { name: "Create folder" }).click();
  await page.getByText("Manage").first().click();
  await expect(page.getByLabel("New name for folder Bind")).toBeVisible();
  await expect(page.getByLabel("Move folder Bind into")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete folder Bind" })).toBeVisible();
});
