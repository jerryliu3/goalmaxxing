import { expect, test } from "@playwright/test";

test.describe("public demo sandbox", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("opens Alex's calendar without hitting production APIs", async ({ page }) => {
    const leaked: string[] = [];
    await page.route("**/api/**", async (route) => {
      leaked.push(route.request().url());
      await route.abort();
    });
    await page.route("**/rest/v1/**", async (route) => {
      leaked.push(route.request().url());
      await route.abort();
    });
    await page.route("**/auth/v1/**", async (route) => {
      leaked.push(route.request().url());
      await route.abort();
    });

    await page.goto("/demo");
    await expect(page).toHaveURL(/\/demo\/calendar/);
    await expect(page.getByTestId("demo-banner")).toBeVisible();
    await expect(page.getByText("Read 20 pages")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("navigation", { name: "Main navigation" })
    ).toBeVisible();
    expect(leaked).toEqual([]);
  });

  test("completing a goal updates this tab", async ({ page }) => {
    await page.goto("/demo/calendar?view=day");
    await expect(page.getByText("Read 20 pages")).toBeVisible({ timeout: 20_000 });

    const row = page
      .locator("[data-planner-entry-key]")
      .filter({ hasText: "Read 20 pages" });
    await row.getByRole("button", { name: "Mark session done" }).click();
    await expect(
      row.getByRole("button", { name: "Mark session not done" })
    ).toBeVisible();
  });
});
