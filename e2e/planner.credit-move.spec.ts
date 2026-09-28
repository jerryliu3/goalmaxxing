import { expect, test, type Page } from "@playwright/test";

const CADENCE_AFFINITY_GOAL_ID = "10000000-0000-4000-8000-000000000024";

interface CadenceAffinityFixture {
  available: boolean;
  scopeMonth: string;
  completionDate: string;
}

interface UnitCreditSnapshot {
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
    const today = formatDate(todayDate);
    const scopeMonth = today.slice(0, 7);
    const response = await fetch(`/api/planner/context?scopeMonth=${scopeMonth}`);
    if (!response.ok) {
      return { available: false, scopeMonth, completionDate: today };
    }

    const body = (await response.json()) as {
      preview?: {
        workUnits?: Array<{
          originalGoalId: string;
          scheduledDate: string | null;
        }>;
      };
    };
    const units =
      body.preview?.workUnits?.filter(
        (unit) => unit.originalGoalId === goalId
      ) ?? [];
    const scheduledDates = new Set(
      units.flatMap((unit) =>
        unit.scheduledDate ? [unit.scheduledDate] : []
      )
    );
    let completionDate = today;
    const candidate = new Date(todayDate);
    while (candidate >= monthStart) {
      const date = formatDate(candidate);
      if (!scheduledDates.has(date)) {
        completionDate = date;
        break;
      }
      candidate.setDate(candidate.getDate() - 1);
    }

    return {
      available: units.length >= 4 && !scheduledDates.has(completionDate),
      scopeMonth,
      completionDate,
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
        body: JSON.stringify({ goalId, date, desiredFactState, timezone }),
      });
      return {
        ok: response.ok,
        status: response.status,
        body: await response.json(),
      };
    },
    { goalId: CADENCE_AFFINITY_GOAL_ID, date, desiredFactState }
  );
  expect(result.ok, JSON.stringify(result.body)).toBe(true);
  return result;
}

test.describe("planner credit move", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Credit-move rail runs on chromium only."
  );

  test("off-schedule completion atomically moves the credited session", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await gotoAppPath(page, "/calendar?view=day");
    const fixture = await resolveCadenceAffinityFixture(page);
    test.skip(
      !fixture.available,
      "Cadence affinity fixture is unavailable for the current calendar day."
    );

    await setExactDateCompletion(page, {
      date: fixture.completionDate,
      desiredFactState: "absent",
    });
    const completion = await setExactDateCompletion(page, {
      date: fixture.completionDate,
      desiredFactState: "present",
    });
    const completionBody = completion.body as {
      plannerMove?: {
        unitKey?: string;
        movedFrom?: string;
        movedTo?: string;
      };
    };
    expect(completionBody.plannerMove?.unitKey).toBeTruthy();
    expect(completionBody.plannerMove?.movedTo).toBe(fixture.completionDate);

    await expect
      .poll(
        async () => {
          const credits = await fetchGoalUnitCredits(page, fixture.scopeMonth);
          const moved = completionBody.plannerMove?.unitKey
            ? credits[completionBody.plannerMove.unitKey]
            : null;
          return (
            moved?.scheduledDate === fixture.completionDate &&
            moved.creditState !== "uncredited"
          );
        },
        { timeout: 20_000 }
      )
      .toBe(true);
  });
});
