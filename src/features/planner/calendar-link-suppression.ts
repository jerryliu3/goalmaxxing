import type { PlannerGoalLinkSummary } from "@cadence/shared/planner/context";

export function isPlannerLinkedTargetSuppressedOnDate({
  goalId,
  date,
  links,
}: {
  goalId: string;
  date: string;
  links: readonly PlannerGoalLinkSummary[] | undefined;
}) {
  const inboundLinks = (links ?? []).filter((link) => link.targetGoalId === goalId);
  if (inboundLinks.length === 0) {
    return false;
  }
  const suppression = inboundLinks[0]!;
  if (suppression.targetSuppressionKind === "indefinite") {
    return true;
  }
  if (
    suppression.targetSuppressionKind === "until" &&
    suppression.targetResumesOn !== null &&
    date < suppression.targetResumesOn
  ) {
    return true;
  }
  return false;
}
