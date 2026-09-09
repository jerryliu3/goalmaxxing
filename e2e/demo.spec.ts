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
    // "Read 20 pages" is a daily-recurring goal, so the default calendar view
    // legitimately renders it on more than one day — any occurrence confirms
    // the demo data loaded.
    await expect(page.getByText("Read 20 pages").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole("navigation", { name: "Main navigation" })
    ).toBeVisible();
    expect(leaked).toEqual([]);
  });

  test("renders demo achievements showcase without production APIs", async ({ page }) => {
    const leaked: string[] = [];
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/xp/achievements")) {
        await route.continue();
        return;
      }
      leaked.push(url);
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

    await page.goto("/demo/achievements");
    await expect(page.getByLabel("Personal records")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel("Trophy showcase")).toBeVisible();
    await expect(page.getByText(/medal shelf/i)).toBeVisible();
    expect(leaked).toEqual([]);
  });

  test("completing a goal updates this tab", async ({ page }) => {
    await page.goto("/demo/calendar?view=day");
    await expect(page.getByText("Read 20 pages")).toBeVisible({ timeout: 20_000 });

    const row = page
      .locator("[data-planner-entry-key]")
      .filter({ hasText: "Read 20 pages" });
    await row.getByRole("button", { name: "Mark session done" }).click({
      delay: 550,
    });
    await expect(
      row.getByRole("button", { name: "Mark session not done" })
    ).toBeVisible();
  });
});
