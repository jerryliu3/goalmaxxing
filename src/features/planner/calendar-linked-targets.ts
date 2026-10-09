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

export function directLinkedGoalIds(
  links: ReadonlyArray<Pick<PlannerGoalLinkSummary, "sourceGoalId" | "targetGoalId">>,
  goalId: string
) {
  const ids = new Set<string>();
  for (const link of links) {
    if (link.sourceGoalId === goalId) ids.add(link.targetGoalId);
    else if (link.targetGoalId === goalId) ids.add(link.sourceGoalId);
  }
  return ids;
}

export function linkedParentGoalIds(
  links: ReadonlyArray<Pick<PlannerGoalLinkSummary, "targetGoalId">>
) {
  return new Set(links.map((link) => link.targetGoalId));
}

/** A parent is any goal another goal counts toward. Hiding them leaves the goals you complete. */
export function showsGoalWhenHidingLinkedParents({
  hideLinkedParents,
  goalId,
  parentGoalIds,
}: {
  hideLinkedParents: boolean;
  goalId: string;
  parentGoalIds: ReadonlySet<string>;
}) {
  if (!hideLinkedParents) return true;
  return !parentGoalIds.has(goalId);
}

