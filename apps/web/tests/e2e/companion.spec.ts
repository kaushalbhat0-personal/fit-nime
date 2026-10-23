import { expect, test } from "@playwright/test";

for (const { name, width, height } of [
  { name: "mobile-375", width: 375, height: 667 },
  { name: "desktop-1280", width: 1280, height: 800 },
] as const) {
  test(`landing companion layout on ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const figure = page.getByAltText("", { exact: true });
    await expect(figure).toBeVisible();
    const overflow = await page.evaluate(
      () => document.scrollingElement?.scrollWidth ?? 0,
    );
    expect(overflow).toBeLessThanOrEqual(width);
  });
}
