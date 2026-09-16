import type { DigestFactItem, DigestFacts } from "@/lib/digest/contract";

function matchesItem(
  item: DigestFactItem,
  completed: Pick<DigestFactItem, "goalId" | "date">
) {
  return item.goalId === completed.goalId && item.date === completed.date;
}

/** Apply the successful exact-date completion to the open check-in immediately. */
export function applyRecapCompletion(
  facts: DigestFacts,
  completed: Pick<DigestFactItem, "goalId" | "date">
): DigestFacts {
  const target = facts.recap.items.find((item) => matchesItem(item, completed));
  if (!target || target.state === "completed") {
    return facts;
  }

  return {
    ...facts,
    recap: {
      ...facts.recap,
      completed: facts.recap.completed + 1,
      items: facts.recap.items.map((item) =>
        matchesItem(item, completed) ? { ...item, state: "completed" } : item
      ),
    },
    recover: {
      ...facts.recover,
      count: Math.max(0, facts.recover.count - 1),
      items: facts.recover.items.filter(
        (item) => !matchesItem(item, completed)
      ),
    },
  };
}
