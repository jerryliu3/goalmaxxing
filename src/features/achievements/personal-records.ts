import { format, parseISO, startOfWeek } from "date-fns";
import type { PersonalRecord } from "@/features/achievements/types";
import type { Completion } from "@/lib/goals/types";

interface GoalStreakSnapshot {
  currentStreak: number;
  longestStreak: number;
}

interface BuildPersonalRecordsInput {
  achievedGoalsCount: number;
  achievedGoalDates: string[];
  goalSnapshots: GoalStreakSnapshot[];
  completions: Completion[];
  level: number;
  totalXp: number;
}

function bestStreakRecord(goalSnapshots: GoalStreakSnapshot[]): PersonalRecord {
  const longest = goalSnapshots.reduce(
    (max, snapshot) => Math.max(max, snapshot.longestStreak),
    0
  );
  const current = goalSnapshots.reduce(
    (max, snapshot) => Math.max(max, snapshot.currentStreak),
    0
  );

  return {
    id: "rec-streak",
    label: "Best streak",
    value: longest > 0 ? `${longest}d` : "—",
    hint:
      current > 0
        ? `Current ${current}d · no shame reset`
        : "Build a streak on any goal",
    accent: "stamp",
  };
}

function bestWeekRecord(completions: Completion[]): PersonalRecord {
  const activeDaysByWeek = new Map<string, Set<string>>();

  for (const completion of completions) {
    const weekStart = startOfWeek(parseISO(completion.completed_on), { weekStartsOn: 1 });
    const weekKey = format(weekStart, "yyyy-MM-dd");
    const activeDays = activeDaysByWeek.get(weekKey) ?? new Set<string>();
    activeDays.add(completion.completed_on);
    activeDaysByWeek.set(weekKey, activeDays);
  }

  let bestWeekKey: string | null = null;
  let bestActiveDays = 0;
  for (const [weekKey, activeDays] of activeDaysByWeek) {
    if (activeDays.size > bestActiveDays) {
      bestActiveDays = activeDays.size;
      bestWeekKey = weekKey;
    }
  }

  const percent =
    bestActiveDays > 0 ? Math.round((bestActiveDays / 7) * 100) : null;

  return {
    id: "rec-week",
    label: "Best week",
    value: percent === null ? "—" : `${percent}%`,
    hint:
      bestWeekKey === null
        ? "Complete a goal to start tracking"
        : `Week of ${format(parseISO(bestWeekKey), "MMM d")}`,
    accent: "gain",
  };
}

function goalsFinishedRecord(
  achievedGoalsCount: number,
  achievedGoalDates: string[]
): PersonalRecord {
  const earliestAchievedOn = achievedGoalDates.reduce<string | null>((earliest, date) => {
    if (earliest === null || date < earliest) {
      return date;
    }
    return earliest;
  }, null);

  let hint = "Finish your first goal";
  if (earliestAchievedOn) {
    const daysSince = Math.max(
      0,
      Math.floor(
        (Date.now() - parseISO(`${earliestAchievedOn}T12:00:00`).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    hint =
      daysSince === 0
        ? "First finish today"
        : `First finish ${daysSince} days ago`;
  }

  return {
    id: "rec-goals",
    label: "Goals finished",
    value: String(achievedGoalsCount),
    hint,
    accent: "sage",
  };
}

function highestLevelRecord(level: number, totalXp: number): PersonalRecord {
  return {
    id: "rec-level",
    label: "Highest level",
    value: level > 0 ? String(level) : "—",
    hint: `${totalXp.toLocaleString()} XP total`,
    accent: "copper",
  };
}

export function buildPersonalRecords(
  input: BuildPersonalRecordsInput
): PersonalRecord[] {
  return [
    bestStreakRecord(input.goalSnapshots),
    bestWeekRecord(input.completions),
    goalsFinishedRecord(input.achievedGoalsCount, input.achievedGoalDates),
    highestLevelRecord(input.level, input.totalXp),
  ];
}
