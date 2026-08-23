import { buildDemoSnapshot, type DemoSnapshot } from "@/features/demo/demo-snapshot";
import { sha256Hex } from "@/lib/planner/canonical";
import type { PlannerDraftCommand } from "@/lib/planner/draft-commands";

let seed: DemoSnapshot | null = null;
let store: DemoSnapshot | null = null;

export function initDemoStore(snapshot: DemoSnapshot) {
  seed = structuredClone(snapshot);
  store = structuredClone(snapshot);
  return store;
}

export function getDemoStore() {
  if (!store) {
    throw new Error("Demo store is not initialized.");
  }
  return store;
}

export function hasDemoStore() {
  return store !== null;
}

export function clearDemoStore() {
  seed = null;
  store = null;
}

export function resetDemoStoreToSeed() {
  if (!seed) {
    throw new Error("Demo store is not initialized.");
  }
  store = structuredClone(seed);
  return store;
}

export function ensureDemoStore(asOfDate: string) {
  if (!store) {
    initDemoStore(buildDemoSnapshot(asOfDate));
  }
  return store;
}

export function setCompletionFact({
  goalId,
  date,
  userId,
  desiredFactState,
}: {
  goalId: string;
  date: string;
  userId: string;
  desiredFactState: "present" | "absent";
}) {
  const current = getDemoStore();
  const existingIndex = current.completions.findIndex(
    (completion) => completion.goal_id === goalId && completion.completed_on === date
  );
  if (desiredFactState === "absent") {
    if (existingIndex >= 0) {
      current.completions.splice(existingIndex, 1);
    }
    return;
  }
  if (existingIndex >= 0) {
    return;
  }
  current.completions.push({
    id: `30000000-0000-4000-8000-${sha256Hex(`${goalId}:${date}`).slice(0, 12)}`,
    goal_id: goalId,
    user_id: userId,
    completed_on: date,
    source: "manual",
    created_at: `${date}T18:00:00.000Z`,
  });
}

export function applyDemoDraftCommands(commands: PlannerDraftCommand[]) {
  const current = getDemoStore();
  for (const command of commands) {
    if (command.kind !== "move_item") {
      continue;
    }
    const item = current.plannerItems.find(
      (candidate) =>
        candidate.goal_id === command.goalId && candidate.unit_key === command.unitKey
    );
    if (!item || command.scheduledDate === null) {
      continue;
    }
    item.scheduled_date = command.scheduledDate;
    item.revision += 1;
  }
}
