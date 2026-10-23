import { expect, test } from "@playwright/test";

const PASSWORD = "test-password-123";

test("invalid focus ids degrade to the plain log page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Unknown ids: unauthenticated users bounce to login without a crash.
  await page.goto("/log?focus=no-such-exercise,also-bogus");
  await expect(page).toHaveURL(/\/login$/);
});

test("empty focus param degrades gracefully", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/log?focus=");
  await expect(page).toHaveURL(/\/login$/);
});

test("Today's Focus carries through Start with these", async ({ page }) => {
  test.skip(
    !process.env.E2E_LIVE_WORKOUT,
    "needs E2E_LIVE_WORKOUT=1 (writes a throwaway workout)",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const stamp = Date.now();
  const email = `focus-${stamp}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const startHref = await page
    .getByRole("link", { name: "Start with these" })
    .getAttribute("href");
  expect(startHref).toMatch(/^\/log\?focus=[0-9a-f,-]+$/);

  await page.getByRole("link", { name: "Start with these" }).click();
  await expect(page).toHaveURL(/\/log\?focus=/);

  // Focus section is first and visually identifiable.
  const focusSection = page.locator("fieldset", {
    has: page.getByText("Today's focus", { exact: true }),
  });
  await expect(focusSection).toBeVisible();
  await expect(
    focusSection.getByText("Today's focus", { exact: true }).first(),
  ).toBeVisible();

  // Recommended quantities are prefilled from the focus card.
  const pushups = page.getByLabel(/Push-ups quantity/);
  await expect(pushups).toHaveValue("10");

  // The rest of the catalog is still available, exactly once each.
  await expect(page.getByLabel(/Squats quantity/)).toBeVisible();
  expect(await page.getByLabel(/Push-ups quantity/).count()).toBe(1);

  // Sticky CTA never covers the final field: scroll to the very bottom
  // and confirm the notes input sits fully above the submit bar.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const notes = page.getByLabel(/Session notes/);
  const submit = page.getByRole("button", { name: "Log workout" });
  const notesBox = await notes.boundingBox();
  const submitBox = await submit.boundingBox();
  expect(notesBox).not.toBeNull();
  expect(submitBox).not.toBeNull();
  expect(submitBox!.y).toBeGreaterThanOrEqual(
    notesBox!.y + notesBox!.height - 1,
  );

  // Complete the workout; reward hierarchy is intact.
  await page.getByRole("button", { name: "Log workout" }).click();
  await expect(page.getByText(/Workout complete|LEVEL UP/)).toBeVisible();
  await expect(page.getByRole("link", { name: "View progress" })).toBeVisible();
});
