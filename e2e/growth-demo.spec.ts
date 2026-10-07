import { expect, test } from "@playwright/test";

const mainNavigation = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Main navigation" });

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of ["insights.main", "planner.calendar"]) {
      localStorage.setItem(`cadence.tab_onboarding_completed.v1:${key}`, "done");
    }
  });
});

test("Growth has one home for each section and Settings has no score or stats", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/demo/growth");
  await expect(page.getByTestId("growth-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Level 6 unlocked", exact: true })).toBeVisible();
  expect(await page.locator("[data-growth-section]").evaluateAll(nodes =>
    nodes.map(node => node.getAttribute("data-growth-section"))
  )).toEqual(["score", "tracker", "achievements", "stats"]);
  const statsSection = page.locator('[data-growth-section="stats"]');
  await expect(page.getByText("2026 activity", { exact: true })).toHaveCount(0);
  await expect(statsSection.getByText("Completion by day of week (last 30 days)")).toHaveCount(0);
  await statsSection.getByRole("button", { name: "View more", exact: true }).click();
  await expect(statsSection.getByText("Completion by day of week (last 30 days)").first()).toBeVisible();
  await statsSection.getByRole("button", { name: "View less", exact: true }).click();
  await expect(statsSection.getByText("Completion by day of week (last 30 days)")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth)
  );

  await mainNavigation(page).getByRole("link", { name: "Goals", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Current goals", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Goal library", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Past goals", exact: true }).first()).toBeVisible();
  await expect(page.getByText("Progress tracker", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Profile settings" }).click();
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(page.getByText("Goal score", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Total activities", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("completion updates Growth stats without refreshing the browser", async ({ page }) => {
  await page.goto("/demo/growth");
  const stats = page.locator('[data-growth-section="stats"]');
  await expect(stats).toBeAttached();
  const count = async () => Number((await stats.innerText()).match(/total activities\s+([\d,]+)/i)?.[1].replaceAll(",", ""));
  const before = await count();
  await mainNavigation(page).getByRole("link", { name: "Agenda", exact: true }).click();
  await expect(page.locator("[data-planner-entry-key]").first()).toBeVisible();
  // The seeded day page uses the same snapshot as Growth. This navigation starts
  // fresh before the mutation; all subsequent navigation stays in the same tab.
  await page.goto("/demo/calendar?view=day");
  const row = page.locator("[data-planner-entry-key]").filter({ hasText: "Read 20 pages" });
  await row.getByRole("button", { name: "Mark session done", exact: true }).click({ delay: 550 });
  await expect(row.getByRole("button", { name: "Mark session not done", exact: true })).toBeVisible();
  await mainNavigation(page).getByRole("link", { name: "Growth", exact: true }).click();
  await expect.poll(count).toBe(before + 1);
});

test("Prism shelf selection and reduced motion work", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/growth");
  await page.getByRole("button", { name: "Lv 2", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Level 2 unlocked", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Locked award", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Still ahead", exact: true })).toBeVisible();
  const hero = page.locator('[aria-label="Trophy showcase"] .prism-medal[data-detail="hero"]');
  expect(await hero.evaluate(node => {
    const transform = getComputedStyle(node).transform;
    return transform === "none" || new DOMMatrixReadOnly(transform).isIdentity;
  })).toBe(true);
  expect(await page.locator(".ach-showcase-hero").evaluate(node => getComputedStyle(node).animationName)).toBe("none");
});

for (const [from, to] of [
  ["/demo/achievements", "/demo/growth"],
  ["/demo/insights", "/demo/growth"],
  ["/demo/insights/more", "/demo/growth#stats"],
  ["/demo/goals/library", "/demo/goals#goal-library"],
  ["/demo/insights/folios?view=past", "/demo/goals#past-goals"],
]) {
  test(`${from} redirects to its canonical destination`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(url => {
      const target = new URL(to, url.origin);
      return url.pathname === target.pathname && url.hash === target.hash;
    });
  });
}

test("featured medal rotates on drag without selecting its numeral", async ({ page }) => {
  await page.goto("/demo/growth");
  const stage = page.getByRole("group", { name: "Level 6 medal", exact: true });
  await stage.scrollIntoViewIfNeeded();
  const medal = stage.locator(".prism-medal");
  const box = await stage.boundingBox();
  if (!box) throw new Error("Featured medal has no bounds");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 65, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => Number.parseFloat(await stage.evaluate(node => (node as HTMLElement).style.getPropertyValue("--ry")))).toBeGreaterThan(30);
  expect(await medal.evaluate(node => getComputedStyle(node).userSelect)).toBe("none");
  expect(await page.evaluate(() => getSelection()?.toString())).toBe("");
  await stage.press("Home");
  await expect.poll(async () => Number.parseFloat(await stage.evaluate(node => (node as HTMLElement).style.getPropertyValue("--ry")))).toBeCloseTo(-14, 1);
});
