import { expect, test, type Page } from "@playwright/test";
import { clearPlannerTabCache } from "./planner-test-utils";

const CADENCE_AFFINITY_GOAL_ID = "10000000-0000-4000-8000-000000000024";
const CADENCE_AFFINITY_GOAL_TITLE = "E2E cadence gym 4x";

interface CadenceAffinityFixture {
  available: boolean;
  scopeMonth: string;
  today: string;
  tomorrow: string;
  pastSlotDate: string;
  unitKey3: string;
  unitKey4: string;
}

interface UnitCreditSnapshot {
  creditedCompletionId: string | null;
  creditState: string;
  scheduledDate: string | null;
}

async function gotoAppPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

async function resolveCadenceAffinityFixture(
  page: Page
): Promise<CadenceAffinityFixture> {
  return page.evaluate(async (goalId) => {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayDate = new Date();
    todayDate.setHours(12, 0, 0, 0);
    const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    const monthEnd = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pastSlotDate = new Date(todayDate);
    pastSlotDate.setDate(pastSlotDate.getDate() - 7);

    const today = formatDate(todayDate);
    const tomorrowStr = formatDate(tomorrow);
    const pastSlot = formatDate(pastSlotDate);
    const periodKey = formatDate(monthStart);
    const scopeMonth = today.slice(0, 7);

    if (tomorrow > monthEnd || pastSlotDate < monthStart) {
      return {
        available: false,
        scopeMonth,
        today,
        tomorrow: tomorrowStr,
        pastSlotDate: pastSlot,
        unitKey3: `cadence:${periodKey}:3`,
        unitKey4: `cadence:${periodKey}:4`,
      };
    }

    const response = await fetch(`/api/planner/context?scopeMonth=${scopeMonth}`);
    if (!response.ok) {
      return {
        available: false,
        scopeMonth,
        today,
        tomorrow: tomorrowStr,
        pastSlotDate: pastSlot,
        unitKey3: `cadence:${periodKey}:3`,
        unitKey4: `cadence:${periodKey}:4`,
      };
    }

    const body = (await response.json()) as {
      preview?: {
        workUnits?: Array<{
          originalGoalId: string;
          unitKey: string;
        }>;
      };
    };
    const units =
      body.preview?.workUnits?.filter(
        (unit) => unit.originalGoalId === goalId
      ) ?? [];

    return {
      available: units.length >= 4,
      scopeMonth,
      today,
      tomorrow: tomorrowStr,
      pastSlotDate: pastSlot,
      unitKey3: `cadence:${periodKey}:3`,
      unitKey4: `cadence:${periodKey}:4`,
    };
  }, CADENCE_AFFINITY_GOAL_ID);
}

async function fetchGoalUnitCredits(
  page: Page,
  scopeMonth: string
): Promise<Record<string, UnitCreditSnapshot>> {
  return page.evaluate(
    async ({ goalId, month }) => {
      const response = await fetch(`/api/planner/context?scopeMonth=${month}`);
      if (!response.ok) {
        return {};
      }
      const body = (await response.json()) as {
        preview?: {
          workUnits?: Array<{
            originalGoalId: string;
            unitKey: string;
            creditedCompletionId: string | null;
            creditState: string;
            scheduledDate: string | null;
          }>;
        };
      };
      const entries =
        body.preview?.workUnits
          ?.filter((unit) => unit.originalGoalId === goalId)
          .map((unit) => [
            unit.unitKey,
            {
              creditedCompletionId: unit.creditedCompletionId,
              creditState: unit.creditState,
              scheduledDate: unit.scheduledDate,
            },
          ]) ?? [];
      return Object.fromEntries(entries);
    },
    { goalId: CADENCE_AFFINITY_GOAL_ID, month: scopeMonth }
  );
}

async function setExactDateCompletion(
  page: Page,
  {
    date,
    desiredFactState,
  }: {
    date: string;
    desiredFactState: "present" | "absent";
  }
) {
  const result = await page.evaluate(
    async ({ goalId, date, desiredFactState }) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const response = await fetch("/api/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goalId,
          date,
          desiredFactState,
          timezone,
        }),
      });
      return {
        ok: response.ok,
        status: response.status,
      };
    },
    {
      goalId: CADENCE_AFFINITY_GOAL_ID,
      date,
      desiredFactState,
    }
  );
  expect(result.ok).toBe(true);
}

async function openDayPreview(page: Page, day: string) {
  const dayCell = page.locator(`[data-day-cell="true"][data-day="${day}"]`);
  await expect(dayCell).toBeVisible({ timeout: 15_000 });
  await dayCell.click();
  // Desktop calendar selection opens the persistent day pane. The old floating
  // preview only exists in the narrow layout, so asserting it here was a stale
  // representation check rather than a schedule-affinity check.
  const dayPane = page.getByTestId("plan-desktop-day-pane");
  await expect(dayPane).toBeVisible({ timeout: 10_000 });
  await expect(dayPane).toContainText(
    new RegExp(day.slice(-2).replace(/^0/, ""))
  );
  return dayPane;
}

async function openCalendarMonth(page: Page, scopeMonth: string) {
  await gotoAppPath(
    page,
    `/calendar?surface=calendar&view=month&month=${scopeMonth}`
  );
  await expect(page).toHaveURL(/\/calendar/);
  await expect(page.getByText("Loading planner month context...")).toHaveCount(0, {
    timeout: 20_000,
  });
}

async function expandUnscheduledGoals(page: Page) {
  const unscheduledTrigger = page.getByRole("button", {
    name: /Unscheduled goals/i,
  });
  await expect(unscheduledTrigger).toBeVisible({ timeout: 30_000 });
  if ((await unscheduledTrigger.getAttribute("aria-expanded")) !== "true") {
    await unscheduledTrigger.click();
  }
  await expect(unscheduledTrigger).toHaveAttribute("aria-expanded", "true");
}

test.describe("cadence schedule-affinity", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Cadence affinity rail runs on chromium only."
  );

  test("past-day checklist completion credits the latest open past session on calendar", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await gotoAppPath(page, "/calendar?view=day");

    const fixture = await resolveCadenceAffinityFixture(page);
    test.skip(
      !fixture.available,
      "Cadence affinity fixture is unavailable for the current calendar day."
    );
    // Current/future unscheduled rows now offer a planning move. Exercise the
    // direct completion control on a past day, where it is still available.
    const completionDay = new Date(`${fixture.today}T12:00:00Z`);
    const credits = await fetchGoalUnitCredits(page, fixture.scopeMonth);
    const scheduledDates = new Set(Object.values(credits).map((unit) => unit.scheduledDate));
    do {
      completionDay.setUTCDate(completionDay.getUTCDate() - 1);
    } while (scheduledDates.has(completionDay.toISOString().slice(0, 10)));
    const completionDate = completionDay.toISOString().slice(0, 10);
    test.skip(
      !completionDate.startsWith(fixture.scopeMonth),
      "No unscheduled past day is available in the fixture month.",
    );

    // This fixture is shared with the credit-move rail. Restore its past
    // session before exercising direct credit assignment so test order cannot
    // turn the direct-completion path into a required move.
    await setExactDateCompletion(page, {
      date: fixture.pastSlotDate,
      desiredFactState: "absent",
    });
    await setExactDateCompletion(page, {
      date: fixture.today,
      desiredFactState: "absent",
    });
    await setExactDateCompletion(page, {
      date: completionDate,
      desiredFactState: "absent",
    });
    await clearPlannerTabCache(page);

    await gotoAppPath(page, `/calendar?view=day&day=${completionDate}`);
    await expect(page).toHaveURL(new RegExp(`[?&]day=${completionDate}(?:&|$)`));
    await expandUnscheduledGoals(page);
    const completeButton = page.getByRole("button", {
      name: `Mark ${CADENCE_AFFINITY_GOAL_TITLE} done`,
    });
    await expect(completeButton).toBeVisible({ timeout: 30_000 });
    await expect(completeButton).toBeEnabled({ timeout: 15_000 });

    const [completionRequest] = await Promise.all([
      page.waitForRequest((request) => {
        if (
          !request.url().includes("/api/completions") ||
          request.method() !== "POST"
        ) {
          return false;
        }
        const payload = request.postDataJSON() as {
          goalId?: string;
          date?: string;
          desiredFactState?: string;
        };
        return (
          payload.goalId === CADENCE_AFFINITY_GOAL_ID &&
          payload.date === completionDate &&
          payload.desiredFactState === "present"
        );
      }),
      completeButton.click({ delay: 550 }),
    ]);
    const payload = completionRequest.postDataJSON() as {
      date: string;
      desiredFactState: string;
    };
    expect(payload.date).toBe(completionDate);
    expect(payload.desiredFactState).toBe("present");

    await expect
      .poll(
        async () => {
          const credits = await fetchGoalUnitCredits(page, fixture.scopeMonth);
          return credits[fixture.unitKey4]?.creditedCompletionId ?? null;
        },
        { timeout: 20_000 }
      )
      .not.toBeNull();

    const credits = await fetchGoalUnitCredits(page, fixture.scopeMonth);
    expect(credits[fixture.unitKey4]?.creditState).not.toBe("uncredited");
    expect(credits[fixture.unitKey3]?.creditState).toBe("uncredited");

    await openCalendarMonth(page, fixture.scopeMonth);
    await page.getByRole("searchbox", { name: "Search goals" }).fill(CADENCE_AFFINITY_GOAL_TITLE);

    const pastDayCell = page.locator(
      `[data-day-cell="true"][data-day="${fixture.pastSlotDate}"]`
    );
    await expect(pastDayCell).toBeVisible();
    const pastEntry = pastDayCell.locator(
      `[data-calendar-day-entry="true"][data-planner-goal-id="${CADENCE_AFFINITY_GOAL_ID}"][data-planner-unit-key="${fixture.unitKey4}"]`
    );
    await expect(pastEntry).toBeHidden();
    const completedEntry = page.locator(
      `[data-day-cell="true"][data-day="${completionDate}"] [data-calendar-day-entry="true"][data-planner-goal-id="${CADENCE_AFFINITY_GOAL_ID}"][data-planner-unit-key="${fixture.unitKey4}"]`
    );
    await expect(completedEntry).toBeVisible({ timeout: 15_000 });

    const tomorrowPreview = await openDayPreview(page, fixture.tomorrow);
    const futureGoalRow = tomorrowPreview.getByRole("button", {
      name: CADENCE_AFFINITY_GOAL_TITLE,
    });
    await expect(futureGoalRow).toBeVisible({ timeout: 10_000 });
    await expect(
      futureGoalRow.locator("svg.lucide-check-circle2, svg.lucide-check-circle-2")
    ).toHaveCount(0);
  });
});
