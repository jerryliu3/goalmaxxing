import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";

const ownerId = "11111111-1111-4111-8111-111111111111";

// These fixtures are isolated to the seeded local database. Never write test
// goals into the account behind a remote PLAYWRIGHT_BASE_URL.
test.beforeEach(async ({ baseURL }) => {
  expect(new URL(baseURL!).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
});

for (const scenario of ["cross-month", "reload-failure", "overdue", "past-month", "earliest-ordinal"] as const) {
  const failReload = scenario === "reload-failure";
  test(`unscheduled move: ${scenario} persists and survives reload`, async ({ page }) => {
    test.setTimeout(120_000);
    const db = new pg.Client({
      connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    });
    await db.connect();
    const goalId = randomUUID();
    const title = `E2E cross-month 5k ${goalId.slice(0, 8)}`;
    const today = new Date().toISOString().slice(0, 10);
    const target = new Date(`${today}T12:00:00Z`);
    target.setUTCDate(target.getUTCDate() + (failReload ? 0 : 1));
    const targetDate = target.toISOString().slice(0, 10);
    const source = new Date(target);
    source.setUTCMonth(source.getUTCMonth() + 3, 20);
    if (scenario === "overdue" || scenario === "past-month" || scenario === "earliest-ordinal") {
      source.setTime(new Date(`${today}T12:00:00Z`).getTime());
      source.setUTCDate(source.getUTCDate() - 1);
      if (scenario !== "overdue") source.setUTCMonth(source.getUTCMonth() - 1, 20);
    }
    const sourceDate = source.toISOString().slice(0, 10);
    const startDate = sourceDate < today ? sourceDate : today;
    const endDate = sourceDate > targetDate ? sourceDate : targetDate;
    const month = targetDate.slice(0, 7);
    try {
      await db.query(
        `insert into public.goals
          (id, owner_id, title, category, category_key, frequency_type,
           target_count, target_basis, start_date, end_date)
         values ($1, $2, $3, 'Health', 'health', 'fixed_milestones',
                 $6, 'lifetime', $4, $5)`,
        [goalId, ownerId, title, startDate, endDate, scenario === "earliest-ordinal" ? 2 : 1]
      );
      await db.query(
        `insert into public.planner_items
          (owner_id, goal_id, unit_key, scheduled_date, locked)
         values ($1, $2, 'milestone:1', $3, false)`,
        [ownerId, goalId, sourceDate]
      );
      if (scenario === "earliest-ordinal") {
        await db.query(
          `insert into public.planner_items (owner_id, goal_id, unit_key, scheduled_date, locked)
           values ($1, $2, 'milestone:2', $3, false)`,
          [ownerId, goalId, today]
        );
      }
      await page.goto(`/calendar?view=day&month=${month}&day=${targetDate}`);
      const unscheduled = page.getByRole("button", { name: /Unscheduled goals/i });
      await expect(unscheduled).toBeVisible({ timeout: 30_000 });
      if ((await unscheduled.getAttribute("aria-expanded")) !== "true") {
        await unscheduled.click();
      }
      const moveButton = page.getByRole("button", {
        name: `Move a planned session for ${title} to this day`,
      });
      await expect(moveButton).toBeVisible({ timeout: 30_000 });
      // Initial preparation can recover an overdue fixture before the user
      // interacts. The command must use the persisted source visible now.
      const beforeMove = await db.query(
        "select unit_key, scheduled_date::text from public.planner_items where goal_id = $1 order by unit_key", [goalId]
      );
      const persistedSourceDate = beforeMove.rows.find((item) => item.unit_key === "milestone:1").scheduled_date;
      await moveButton.click();
      await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
      const save = page.getByRole("button", { name: "Save plan", exact: true });
      await expect(save).toBeEnabled({ timeout: 30_000 });

      if (failReload) {
        await page.route("**/api/planner/context?**", (route) =>
          route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Injected calendar reload failure" }) })
        );
      }
      const saved = page.waitForResponse((response) =>
        response.url().endsWith("/api/planner/save") && response.request().method() === "POST"
      );
      await save.click();
      const response = await saved;
      expect(response.status(), await response.text()).toBe(200);
      const command = response.request().postDataJSON().draftCommands;
      expect(command).toEqual([expect.objectContaining({
        kind: "move_item", goalId, unitKey: "milestone:1",
        sourceDate: persistedSourceDate, scheduledDate: targetDate,
      })]);
      await expect(page.getByTestId("planner-preview-mode-badge")).toBeHidden();
      if (failReload) {
        await expect(page.getByText("Plan saved. Calendar reload is temporarily unavailable, but the draft is no longer pending.")).toBeVisible();
        // The saved placement must remain on screen even while reload fails.
        // Otherwise a second move can reuse the old source date and digest.
        await expect(moveButton).toBeHidden();
        const savedDigest = (await response.json()).scheduleDigest;
        const cachedDigest = await page.evaluate((scopeMonth) => {
          const key = Object.keys(sessionStorage).find((key) => key.endsWith(`planner-context:${scopeMonth}`));
          return key ? JSON.parse(sessionStorage.getItem(key)!).value.revisions.scheduleDigest : null;
        }, month);
        expect(cachedDigest).toBe(savedDigest);
      }
      const rows = await db.query(
        "select scheduled_date::text from public.planner_items where goal_id = $1 and unit_key = $2",
        [goalId, scenario === "earliest-ordinal" ? "milestone:2" : "milestone:1"]
      );
      expect(rows.rows).toEqual([{ scheduled_date: targetDate }]);
      if (scenario === "earliest-ordinal") {
        // Ordinals deliberately follow chronological order after saving.
        const other = await db.query("select scheduled_date::text from public.planner_items where goal_id = $1 and unit_key = 'milestone:1'", [goalId]);
        expect(other.rows[0].scheduled_date).toBe(beforeMove.rows.find((item) => item.unit_key === "milestone:2").scheduled_date);
      }
      const completions = await db.query(
        "select count(*)::int as count from public.completions where goal_id = $1", [goalId]
      );
      expect(completions.rows[0].count).toBe(0);
      if (failReload) {
        // Completion immediately after save must use the new persisted item ID,
        // even though the calendar GET is still failing.
        const completed = page.waitForResponse((response) =>
          response.url().endsWith("/api/completions") && response.request().method() === "POST"
        );
        await page.getByRole("button", { name: `Mark session done ${title}`, exact: true })
          .getByRole("button", { name: "Mark session done", exact: true })
          .click({ delay: 550 });
        const completionResponse = await completed;
        expect(completionResponse.status(), await completionResponse.text()).toBe(200);
        await page.unroute("**/api/planner/context?**");
      }
      await page.reload();
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
      await expect(moveButton).toBeHidden();
      await expect(page.getByTestId("planner-preview-mode-badge")).toBeHidden();
    } finally {
      await db.query("delete from public.goals where id = $1 and owner_id = $2", [goalId, ownerId]);
      await db.end();
    }
  });
}
