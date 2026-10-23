import { expect, test } from "@playwright/test";

test("unauthenticated /log redirects to login", async ({ page }) => {
  await page.goto("/log");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

// Full write flow: signup → log → success → history. Writes to the
// configured project, so it runs only when explicitly opted in (avoids
// residue in the shared project from routine test runs).
test("authenticated user can log a workout", async ({ page }) => {
  test.skip(
    !process.env.E2E_LIVE_WORKOUT,
    "needs E2E_LIVE_WORKOUT=1 (writes a throwaway workout)",
  );
  const stamp = Date.now();
  const email = `workout-${stamp}@example.com`;
  const password = "test-password-123";

  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/log");
  await expect(
    page.getByRole("heading", { name: "Log workout" }),
  ).toBeVisible();
  await page.getByLabel(/Push-ups quantity/).fill("20");
  await page.getByRole("button", { name: "Log workout" }).click();
  await expect(page.getByText(/Workout logged/)).toBeVisible();
  // Authoritative award feedback: 20 push-ups → 20 strength XP.
  await expect(page.getByText("+20 XP")).toBeVisible();
  await expect(page.getByText("Push-ups")).toBeVisible();
});
