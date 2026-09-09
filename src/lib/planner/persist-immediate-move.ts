import { getApiErrorMessage, postJson } from "@/lib/api/client";
import { monthFromDate } from "@/lib/planner/dates";
import {
  plannerDraftWindowUnavailableMessage,
  tryBuildPlannerDraftSaveWindow,
} from "@/lib/planner/draft-window";
import type { PlannerDraftCommand } from "@/lib/planner/draft-commands";
import { createClientUuid } from "@cadence/shared/ids";
import type { PlannerContextPayload } from "@cadence/shared/planner/context";

const EMPTY_PREVIEW_HASH = "0".repeat(64);

export function buildImmediateMoveCommand({
  goalId,
  unitKey,
  sourceDate,
  scheduledDate,
}: {
  goalId: string;
  unitKey: string;
  sourceDate: string;
  scheduledDate: string;
}): PlannerDraftCommand {
  return {
    id: createClientUuid(),
    sequence: 1,
    kind: "move_item",
    goalId,
    unitKey,
    sourceDate,
    scheduledDate,
  };
}

export async function persistImmediatePlannerMove({
  context,
  goalId,
  unitKey,
  sourceDate,
  scheduledDate,
}: {
  context: PlannerContextPayload;
  goalId: string;
  unitKey: string;
  sourceDate: string;
  scheduledDate: string;
}) {
  const expectedDigest = context.revisions.scheduleDigest;
  if (!expectedDigest) {
    throw new Error("Planner state is stale. Refresh and try again.");
  }

  const command = buildImmediateMoveCommand({
    goalId,
    unitKey,
    sourceDate,
    scheduledDate,
  });
  const saveWindow = tryBuildPlannerDraftSaveWindow({
    currentMonth: context.scopeMonth,
    commands: [command],
    workUnits: context.preview?.workUnits ?? [],
    extraMonths: [monthFromDate(context.asOfDate), monthFromDate(scheduledDate)],
  });
  if (!saveWindow.ok) {
    throw new Error(plannerDraftWindowUnavailableMessage(saveWindow));
  }

  const previewHash =
    context.preview?.generationInputHash &&
    /^[a-f0-9]{64}$/.test(context.preview.generationInputHash)
      ? context.preview.generationInputHash
      : EMPTY_PREVIEW_HASH;

  try {
    await postJson("/api/planner/save", {
      expectedDigest,
      startDate: saveWindow.window.start,
      endDate: saveWindow.window.end,
      previewHash,
      eligibilityMode: context.preview?.eligibilityMode,
      confirmationHash: null,
      draftCommands: [command],
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "The session could not be moved."));
  }
}
