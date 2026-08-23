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
    await expect(page.getByText("Strength")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("navigation", { name: "Main navigation" })
    ).toBeVisible();
    expect(leaked).toEqual([]);
  });
});
