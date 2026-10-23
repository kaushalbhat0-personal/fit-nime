import { expect, test } from "@playwright/test";

test("foundation page renders Fit-Nime heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Train. Log. Level up." }),
  ).toBeVisible();
});
