import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";

const ownerId = "11111111-1111-4111-8111-111111111111";

for (const scenario of ["projected-source", "legacy-credit", "credited-old-placement"] as const) {
  test(`saved-session regression: ${scenario}`, async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    expect(new URL(baseURL!).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
    const db = new pg.Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
    await db.connect();
    const goalId = randomUUID();
    const sourceId = randomUUID();
    const title = `E2E saved session ${goalId.slice(0, 8)}`;
    // Linked rows include the relationship badge in their accessible name.
    const sessionRow = page.getByRole("button", { name: new RegExp(`^${title}(?:$| )`) });
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date(`${today}T12:00:00Z`);
    const date = (monthOffset: number, day: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, day, 12)).toISOString().slice(0, 10);
    const first = date(1, 1);
    const destination = date(1, 3);
    const later = date(1, 18);
    const month = first.slice(0, 7);
    try {
      await db.query(`insert into public.goals (id, owner_id, title, category, category_key,
        frequency_type, recurrence_interval, target_count, target_basis, start_date, end_date)
        values ($1, $2, $3, 'Health', 'health', 'recurring', 'weekly', 3, 'lifetime', $4, $5)`,
      [goalId, ownerId, title, date(-1, 1), date(3, 0)]);
      await db.query(`insert into public.planner_items (owner_id, goal_id, unit_key, scheduled_date, locked)
        values ($1, $2, 'total:1', $3, false), ($1, $2, 'total:3', $4, false)`, [ownerId, goalId, first, later]);
      if (scenario === "projected-source") {
        await db.query(`insert into public.goals (id, owner_id, title, category, category_key,
          frequency_type, recurrence_interval, target_count, target_basis, start_date, end_date)
          values ($1, $2, 'E2E linked source', 'Health', 'health', 'recurring', 'weekly', 1, 'lifetime', $3, $4)`,
        [sourceId, ownerId, date(0, 1), date(1, 0)]);
        await db.query("insert into public.goal_links (source_goal_id, target_goal_id, owner_id) values ($1, $2, $3)", [sourceId, goalId, ownerId]);
        await db.query("insert into public.planner_items (owner_id, goal_id, unit_key, scheduled_date, locked) values ($1, $2, 'total:1', $3, false)", [ownerId, sourceId, today]);
      } else {
        if (scenario === "legacy-credit") {
          await db.query("insert into public.planner_items (owner_id, goal_id, unit_key, scheduled_date, locked) values ($1, $2, 'total:2', $3, false)", [ownerId, goalId, today]);
        }
        await db.query("insert into public.completions (goal_id, user_id, completed_on, source, planner_unit_key) values ($1, $2, $3, 'manual', $4)",
          [goalId, ownerId, today, scenario === "legacy-credit" ? null : "total:1"]);
      }
      // Preserve the legacy fixture exactly: use the real context reader when
      // page-open prepare is requested, so auto-preparation cannot repair or
      // delete the faulty saved row before this regression exercises it.
      await page.route("**/api/planner/prepare", async (route) => {
        const body = route.request().postDataJSON();
        const response = await page.request.get(`/api/planner/context?scopeMonth=${body.scopeMonth}&visibleStart=${body.visibleStart}&visibleEnd=${body.visibleEnd}`);
        await route.fulfill({ response });
      });
      await page.goto(`/calendar?view=day&month=${month}&day=${first}`);
      await expect(page.getByRole("button", { name: /Scheduled goals/ })).toBeVisible({ timeout: 30_000 });
      const findWorkUnit = async () => {
        const contextResponse = await page.request.get(`/api/planner/context?scopeMonth=${month}`);
        expect(contextResponse.status(), await contextResponse.text()).toBe(200);
        const context = await contextResponse.json();
        return context.preview.workUnits.find(
          (candidate: { originalGoalId: string; unitKey: string }) =>
            candidate.originalGoalId === goalId && candidate.unitKey === "total:1"
        );
      };
      let unit: Awaited<ReturnType<typeof findWorkUnit>>;
      await expect
        .poll(async () => {
          unit = await findWorkUnit();
          return unit;
        }, { timeout: 30_000 })
        .toBeTruthy();
      if (!unit) {
        throw new Error("Expected planner preview work unit total:1 to be present.");
      }
      const moveToDestination = async (fromDate: string) => {
        await sessionRow.click({ timeout: 15_000 });
        const editor = page.getByRole("region", { name: "Edit planned session" });
        await editor.getByRole("button", { name: new RegExp(new Date(`${fromDate}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })) }).click();
        const dateInput = editor.getByLabel("Date", { exact: true });
        const save = page.getByRole("button", { name: "Save plan", exact: true });
        // Wait for the controlled date edit to stage a draft. Mobile WebKit
        // can reset the field while the editor finishes rendering.
        await expect(async () => {
          await dateInput.fill(destination);
          await dateInput.blur();
          await expect(dateInput).toHaveValue(destination);
          await expect(save).toBeEnabled();
        }).toPass({ timeout: 15_000 });
        const saved = page.waitForResponse((response) => response.url().endsWith("/api/planner/save") && response.request().method() === "POST");
        await save.click();
        const response = await saved;
        expect(response.status(), await response.text()).toBe(200);
        const rows = await db.query("select unit_key, scheduled_date::text from public.planner_items where goal_id = $1 order by unit_key", [goalId]);
        return rows.rows;
      };
      if (scenario === "credited-old-placement") {
        expect(unit.creditState).toBe("completed_elsewhere");
        await expect(sessionRow).toHaveCount(0);
        // Today's completion date is outside this save's window, so a sibling
        // move must leave the credited row on its saved date.
        await page.goto(`/calendar?view=day&month=${month}&day=${later}`);
        await expect(page.getByRole("button", { name: /Scheduled goals/ })).toBeVisible({ timeout: 30_000 });
        expect(await moveToDestination(later)).toEqual([
          { unit_key: "total:1", scheduled_date: first },
          { unit_key: "total:3", scheduled_date: destination },
        ]);
      } else {
        expect(unit.creditState).toBe("uncredited");
        const rows = await moveToDestination(first);
        expect(rows.map((row) => row.scheduled_date)).toContain(destination);
        expect(rows.map((row) => row.scheduled_date)).toContain(later);
        await page.reload();
        await expect(page.getByRole("button", { name: /Scheduled goals/ })).toBeVisible({ timeout: 30_000 });
        await expect(sessionRow).toHaveCount(0);
        await expect(page.getByTestId("planner-preview-mode-badge")).toBeHidden();
      }
      const facts = await db.query("select completed_on::text, planner_unit_key from public.completions where goal_id = $1", [goalId]);
      expect(facts.rows).toEqual(scenario === "projected-source" ? [] : [{ completed_on: today, planner_unit_key: scenario === "legacy-credit" ? null : "total:1" }]);
    } finally {
      // The prepare stub may still be awaiting its context read at teardown.
      try {
        if (!page.isClosed()) {
          await page.unrouteAll({ behavior: "ignoreErrors" });
        }
      } finally {
        try {
          await db.query("delete from public.goals where id = any($1::uuid[]) and owner_id = $2", [[sourceId, goalId], ownerId]);
        } finally {
          await db.end();
        }
      }
    }
  });
}
