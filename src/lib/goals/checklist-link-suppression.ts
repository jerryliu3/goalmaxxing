import type { Goal, GoalLink } from "@/lib/goals/types";
import {
  buildLinkSuppressionInboundIndex,
  isSuppressedOnDate,
  resolveLinkSuppression,
  toLinkSuppressionSource,
} from "@/lib/planner/link-suppression";

export function shouldHideLinkedTargetOnChecklistDate({
  goalId,
  goals,
  links,
  ownerId,
  viewDate,
}: {
  goalId: string;
  goals: readonly Goal[];
  links: ReadonlyArray<Pick<GoalLink, "source_goal_id" | "target_goal_id">>;
  ownerId: string;
  viewDate: string;
}) {
  const linkEdges = links.map((link) => ({
    sourceGoalId: link.source_goal_id,
    targetGoalId: link.target_goal_id,
  }));
  const suppression = resolveLinkSuppression({
    goalId,
    links: linkEdges,
    sourcesById: new Map(goals.map((goal) => [goal.id, toLinkSuppressionSource(goal)])),
    ownerId,
    asOfDate: viewDate,
  });
  return isSuppressedOnDate(suppression, viewDate);
}

export function selectChecklistHiddenLinkedTargetGoalIds({
  goals,
  links,
  ownerId,
  viewDate,
}: {
  goals: readonly Goal[];
  links: ReadonlyArray<Pick<GoalLink, "source_goal_id" | "target_goal_id">>;
  ownerId: string;
  viewDate: string;
}) {
  const linkEdges = links.map((link) => ({
    sourceGoalId: link.source_goal_id,
    targetGoalId: link.target_goal_id,
  }));
  const inboundIndex = buildLinkSuppressionInboundIndex(linkEdges);
  const sourcesById = new Map(
    goals.map((goal) => [goal.id, toLinkSuppressionSource(goal)])
  );
  const hidden = new Set<string>();

  for (const targetGoalId of inboundIndex.keys()) {
    const suppression = resolveLinkSuppression({
      goalId: targetGoalId,
      inboundSourceIdsByTargetId: inboundIndex,
      sourcesById,
      ownerId,
      asOfDate: viewDate,
    });
    if (isSuppressedOnDate(suppression, viewDate)) {
      hidden.add(targetGoalId);
    }
  }

  return hidden;
}

export function filterChecklistLinkedTargetSuppressedGoals<TGoal extends { id: string }>(
  goals: readonly TGoal[],
  hiddenLinkedTargetGoalIds: ReadonlySet<string>
): TGoal[] {
  return goals.filter((goal) => !hiddenLinkedTargetGoalIds.has(goal.id));
}
