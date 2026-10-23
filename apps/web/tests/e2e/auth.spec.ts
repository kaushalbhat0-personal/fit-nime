import { expect, test } from "@playwright/test";

test("unauthenticated dashboard redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("login page renders the sign-in form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("signup page flags mismatched passwords without a backend", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("brock@example.com");
  await page.getByLabel("Password", { exact: true }).fill("onix1234");
  await page.getByLabel("Confirm password").fill("geodude123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
});
