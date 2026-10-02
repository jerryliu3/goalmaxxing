import { z } from "zod";
import { getGoalProgressSnapshot } from "./progress";
import type { Completion, Goal, GoalLink } from "./types";

export const completionFeedbackSchema = z.object({
  date: z.iso.date(),
  goals: z.array(z.object({
    goalId: z.uuid(), title: z.string(), fromTitle: z.string().nullable(),
    before: z.number().nonnegative(), after: z.number().nonnegative(),
    target: z.number().nonnegative(), achieved: z.boolean(), newlyAchieved: z.boolean(),
  })).max(1000),
});
export type CompletionFeedback = z.infer<typeof completionFeedbackSchema>;

/** Presentation order only. The database owns cascade eligibility and writes. */
export function linkedFeedbackOrder(sourceId: string, links: Pick<GoalLink, "source_goal_id" | "target_goal_id">[]) {
  const parents = new Map<string, string | null>([[sourceId, null]]);
  for (const id of parents.keys()) {
    for (const link of links) {
      if (link.source_goal_id === id && !parents.has(link.target_goal_id)) parents.set(link.target_goal_id, id);
    }
  }
  return parents;
}

export function buildCompletionFeedback({ sourceId, date, asOfDate, goals, links, before, after, weekStartsOn }: {
  sourceId: string; date: string; asOfDate: string; goals: Goal[]; links: GoalLink[];
  before: Completion[]; after: Completion[]; weekStartsOn: number;
}): CompletionFeedback {
  const byId = new Map(goals.map(goal => [goal.id, goal]));
  const previousFacts = new Set(before.map(fact => `${fact.goal_id}:${fact.completed_on}`));
  const options = { weeklyAnchor: { weekStartsOn } };
  return { date, goals: [...linkedFeedbackOrder(sourceId, links)].flatMap(([id, parentId]) => {
    const goal = byId.get(id);
    const fact = after.find(item => item.goal_id === id && item.completed_on === date);
    if (!goal || !fact || previousFacts.has(`${id}:${date}`) || (parentId && fact.source !== "linked_cascade")) return [];
    const oldSummary = getGoalProgressSnapshot(goal, before.filter(item => item.goal_id === id), asOfDate, options);
    const summary = getGoalProgressSnapshot(goal, after.filter(item => item.goal_id === id), asOfDate, options);
    const period = goal.frequency_type === "recurring" && goal.target_basis === "period";
    return [{ goalId: id, title: goal.title, fromTitle: parentId ? byId.get(parentId)?.title ?? null : null,
      before: period ? oldSummary.currentPeriodCompletionCount : oldSummary.creditedUnitCount,
      after: period ? summary.currentPeriodCompletionCount : summary.creditedUnitCount,
      target: period ? summary.currentPeriodTarget ?? 0 : summary.expectedUnitCount,
      achieved: summary.outcome === "achieved",
      newlyAchieved: oldSummary.outcome !== "achieved" && summary.outcome === "achieved",
    }];
  }) };
}
