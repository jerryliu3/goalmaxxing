import type { PlannerGoalLinkSummary } from "@cadence/shared/planner/context";

export function buildPlannerLinkedTargetIndexes(
  links: ReadonlyArray<PlannerGoalLinkSummary>
) {
  const linksBySourceGoalId = new Map<string, PlannerGoalLinkSummary[]>();
  const linksByTargetGoalId = new Map<string, PlannerGoalLinkSummary[]>();
  for (const link of links) {
    const sourceLinks = linksBySourceGoalId.get(link.sourceGoalId) ?? [];
    sourceLinks.push(link);
    linksBySourceGoalId.set(link.sourceGoalId, sourceLinks);
    const targetLinks = linksByTargetGoalId.get(link.targetGoalId) ?? [];
    targetLinks.push(link);
    linksByTargetGoalId.set(link.targetGoalId, targetLinks);
  }
  for (const sourceLinks of linksBySourceGoalId.values()) {
    sourceLinks.sort((left, right) => left.targetGoalId.localeCompare(right.targetGoalId));
  }
  for (const targetLinks of linksByTargetGoalId.values()) {
    targetLinks.sort((left, right) => left.sourceGoalId.localeCompare(right.sourceGoalId));
  }
  return {
    linksBySourceGoalId,
    linksByTargetGoalId,
  };
}

