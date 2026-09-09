import { expect, test, type Page } from "@playwright/test";

const CADENCE_AFFINITY_GOAL_ID = "10000000-0000-4000-8000-000000000024";
const CADENCE_AFFINITY_GOAL_TITLE = "E2E cadence gym 4x";
const COMPLETION_HOLD_CLICK = { delay: 550 } as const;

interface CadenceAffinityFixture {
  available: boolean;
  scopeMonth: string;
  today: string;
  tomorrow: string;
  unitKey3: string;
  unitKey4: string;
}

interface UnitCreditSnapshot {
  creditState: string;
  scheduledDate: string | null;
}

async function gotoAppPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

async function dismissTabOnboardingIfPresent(page: Page) {
  const onboardingDialog = page.locator('[aria-labelledby^="tab-onboarding-"]');
  if (!(await onboardingDialog.first().isVisible().catch(() => false))) {
    return;
  }
  await onboardingDialog.getByRole("button", { name: "Dismiss" }).click();
  await expect(onboardingDialog.first()).toBeHidden();
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
    const today = formatDate(todayDate);
    const tomorrowStr = formatDate(tomorrow);
    const periodKey = formatDate(monthStart);
    const scopeMonth = today.slice(0, 7);

    if (tomorrow > monthEnd) {
      return {
        available: false,
        scopeMonth,
        today,
        tomorrow: tomorrowStr,
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

async function expandUnscheduledGoals(page: Page) {
  const unscheduledTrigger = page.getByRole("button", { name: /Unscheduled goals/i });
  if (!(await unscheduledTrigger.isVisible().catch(() => false))) {
    return;
  }
  if ((await unscheduledTrigger.getAttribute("aria-expanded")) !== "true") {
    await unscheduledTrigger.click();
  }
}

test.describe("planner credit move", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Credit-move rail runs on chromium only."
  );

  test("off-schedule day completion saves a move before marking done", async ({
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
      date: fixture.tomorrow,
      desiredFactState: "absent",
    });

    await gotoAppPath(page, `/calendar?view=day&day=${fixture.tomorrow}`);
    await dismissTabOnboardingIfPresent(page);
    await expandUnscheduledGoals(page);

    const moveButton = page.getByRole("button", {
      name: `Move a planned session to complete ${CADENCE_AFFINITY_GOAL_TITLE}`,
    });
    await expect(moveButton).toBeVisible({ timeout: 15_000 });

    await moveButton.click();
    await expect(
      page.getByRole("heading", { name: /Schedule this goal for/i })
    ).toBeVisible();

    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/planner/save") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const saveResponse = await saveResponsePromise;
    expect(saveResponse.ok()).toBe(true);
    const savePayload = saveResponse.request().postDataJSON() as {
      draftCommands?: Array<{
        kind?: string;
        goalId?: string;
        scheduledDate?: string;
      }>;
    };
    expect(savePayload.draftCommands?.[0]?.kind).toBe("move_item");
    expect(savePayload.draftCommands?.[0]?.goalId).toBe(CADENCE_AFFINITY_GOAL_ID);
    expect(savePayload.draftCommands?.[0]?.scheduledDate).toBe(fixture.tomorrow);

    await expect
      .poll(
        async () => {
          const credits = await fetchGoalUnitCredits(page, fixture.scopeMonth);
          return Object.values(credits).some(
            (unit) => unit.scheduledDate === fixture.tomorrow
          );
        },
        { timeout: 20_000 }
      )
      .toBe(true);

    await page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/planner/context") && response.ok(),
        { timeout: 30_000 }
      )
      .catch(() => undefined);
    const goalRow = page
      .locator("[data-planner-entry-key]")
      .filter({ hasText: CADENCE_AFFINITY_GOAL_TITLE });
    await expect(goalRow).toBeVisible({ timeout: 30_000 });

    const completeButton = goalRow.getByRole("button", {
      name: "Mark session done",
    });
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
          payload.date === fixture.tomorrow &&
          payload.desiredFactState === "present"
        );
      }),
      completeButton.click(COMPLETION_HOLD_CLICK),
    ]);
    const completionPayload = completionRequest.postDataJSON() as {
      date: string;
      desiredFactState: string;
    };
    expect(completionPayload.date).toBe(fixture.tomorrow);
    expect(completionPayload.desiredFactState).toBe("present");
  });
});
