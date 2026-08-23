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

  test("completing a goal stays in this tab until refresh", async ({ page }) => {
    await page.goto("/demo/calendar");
    await expect(page.getByText("Read 20 pages")).toBeVisible({ timeout: 20_000 });

    const card = page.locator("[data-slot=card]").filter({ hasText: "Read 20 pages" });
    await card.getByRole("button", { name: /Mark goal as complete|Complete goal for/ }).click();
    await expect(
      card.getByRole("button", {
        name: /Unmark goal completion for current period|Remove completion for/,
      })
    ).toBeVisible();

    await page.goto("about:blank");
    await page.goto("/demo/calendar");
    await expect(page.getByText("Read 20 pages")).toBeVisible({ timeout: 20_000 });
    await expect(
      page
        .locator("[data-slot=card]")
        .filter({ hasText: "Read 20 pages" })
        .getByRole("button", { name: /Mark goal as complete|Complete goal for/ })
    ).toBeVisible({ timeout: 20_000 });
  });
});
