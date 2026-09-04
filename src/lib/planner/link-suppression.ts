import type { Goal } from "@/lib/goals/types";
import { resolveGoalPlanningEndDate } from "@/lib/goals/definition-validation";
import { addDaysToDateString, compareDateStrings } from "@/lib/goals/periods";
import type { DateWindow } from "@/lib/planner/dates";

export interface LinkSuppressionSource {
  id: string;
  ownerId: string;
  isDeleted: boolean;
  archivedAt: string | null;
  startDate: string;
  endDate: string | null;
  frequencyType: Goal["frequency_type"];
  targetCount: number | null;
}

export type LinkSuppression =
  | { kind: "none" }
  | { kind: "until"; through: string }
  | { kind: "indefinite" };

interface LinkEdge {
  sourceGoalId: string;
  targetGoalId: string;
}

type LinkEdgeInput =
  | LinkEdge
  | { source_goal_id: string; target_goal_id: string };

export interface LinkSuppressionSummary {
  targetGoalId: string;
  targetSuppressionKind: LinkSuppression["kind"];
  targetResumesOn: string | null;
}

function toLinkEdge(link: LinkEdgeInput): LinkEdge {
  if ("sourceGoalId" in link) {
    return { sourceGoalId: link.sourceGoalId, targetGoalId: link.targetGoalId };
  }
  return {
    sourceGoalId: link.source_goal_id,
    targetGoalId: link.target_goal_id,
  };
}

export function buildLinkSuppressionInboundIndex(
  links: ReadonlyArray<LinkEdge>
): ReadonlyMap<string, ReadonlySet<string>> {
  const inboundSourceIdsByTargetId = new Map<string, Set<string>>();
  for (const link of links) {
    const sourceIds =
      inboundSourceIdsByTargetId.get(link.targetGoalId) ?? new Set<string>();
    sourceIds.add(link.sourceGoalId);
    inboundSourceIdsByTargetId.set(link.targetGoalId, sourceIds);
  }
  return inboundSourceIdsByTargetId;
}

export function toLinkSuppressionSource(goal: Goal): LinkSuppressionSource {
  return {
    id: goal.id,
    ownerId: goal.owner_id,
    isDeleted: goal.is_deleted,
    archivedAt: goal.archived_at,
    startDate: goal.start_date,
    endDate: goal.end_date,
    frequencyType: goal.frequency_type,
    targetCount: goal.target_count,
  };
}

export function resolveLinkSuppression({
  goalId,
  links,
  inboundSourceIdsByTargetId,
  sourcesById,
  ownerId,
  asOfDate,
}: {
  goalId: string;
  links?: ReadonlyArray<LinkEdge>;
  inboundSourceIdsByTargetId?: ReadonlyMap<string, ReadonlySet<string>>;
  sourcesById: ReadonlyMap<string, LinkSuppressionSource>;
  ownerId: string;
  asOfDate: string;
}): LinkSuppression {
  const inboundIndex =
    inboundSourceIdsByTargetId ?? buildLinkSuppressionInboundIndex(links ?? []);

  const visited = new Set<string>([goalId]);
  const queue = [goalId];
  let queueIndex = 0;
  let latestSuppressionEnd: string | null = null;

  while (queueIndex < queue.length) {
    const currentTargetId = queue[queueIndex]!;
    queueIndex += 1;
    const sourceIds = inboundIndex.get(currentTargetId);
    if (!sourceIds) {
      continue;
    }

    for (const sourceId of sourceIds) {
      // Cycles should not let a goal suppress itself through ancestry loops.
      if (sourceId !== goalId) {
        const source = sourcesById.get(sourceId);
        if (
          source &&
          source.ownerId === ownerId &&
          !source.isDeleted &&
          source.archivedAt === null
        ) {
          const effectiveEnd = resolveGoalPlanningEndDate({
            frequencyType: source.frequencyType,
            targetCount: source.targetCount,
            startDate: source.startDate,
            endDate: source.endDate,
            asOfDate,
          });
          if (
            effectiveEnd === null ||
            compareDateStrings(effectiveEnd, source.startDate) >= 0
          ) {
            if (effectiveEnd === null) {
              return { kind: "indefinite" };
            }
            if (
              latestSuppressionEnd === null ||
              compareDateStrings(effectiveEnd, latestSuppressionEnd) > 0
            ) {
              latestSuppressionEnd = effectiveEnd;
            }
          }
        }
      }

      if (!visited.has(sourceId)) {
        visited.add(sourceId);
        queue.push(sourceId);
      }
    }
  }

  if (latestSuppressionEnd === null) {
    return { kind: "none" };
  }
  return { kind: "until", through: latestSuppressionEnd };
}

export function isSuppressedOnDate(suppression: LinkSuppression, date: string) {
  return (
    suppression.kind === "indefinite" ||
    (suppression.kind === "until" &&
      compareDateStrings(suppression.through, date) >= 0)
  );
}

export function getLinkResumeDate(suppression: LinkSuppression): string | null {
  if (suppression.kind !== "until") {
    return null;
  }
  return addDaysToDateString(suppression.through, 1);
}

export function isFullySuppressedForWindow(
  suppression: LinkSuppression,
  window: DateWindow
) {
  if (suppression.kind === "indefinite") {
    return true;
  }
  if (suppression.kind === "none") {
    return false;
  }
  const resumeDate = getLinkResumeDate(suppression);
  return (
    resumeDate !== null &&
    compareDateStrings(resumeDate, window.end) > 0
  );
}

export function linkSuppressionFromSummary(
  summary: Pick<LinkSuppressionSummary, "targetSuppressionKind" | "targetResumesOn">
): LinkSuppression {
  if (summary.targetSuppressionKind === "indefinite") {
    return { kind: "indefinite" };
  }
  if (summary.targetSuppressionKind === "until" && summary.targetResumesOn) {
    return {
      kind: "until",
      through: addDaysToDateString(summary.targetResumesOn, -1),
    };
  }
  return { kind: "none" };
}

export function isLinkedTargetSuppressedOnDate({
  goalId,
  date,
  linkSummaries,
}: {
  goalId: string;
  date: string;
  linkSummaries: readonly LinkSuppressionSummary[] | undefined;
}) {
  const summary = (linkSummaries ?? []).find((link) => link.targetGoalId === goalId);
  if (!summary) {
    return false;
  }
  return isSuppressedOnDate(linkSuppressionFromSummary(summary), date);
}

export function selectSuppressedGoalIdsOnDate({
  goals,
  links,
  ownerId,
  date,
}: {
  goals: readonly Goal[];
  links: ReadonlyArray<LinkEdgeInput>;
  ownerId: string;
  date: string;
}): ReadonlySet<string> {
  const linkEdges = links.map(toLinkEdge);
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
      asOfDate: date,
    });
    if (isSuppressedOnDate(suppression, date)) {
      hidden.add(targetGoalId);
    }
  }

  return hidden;
}
