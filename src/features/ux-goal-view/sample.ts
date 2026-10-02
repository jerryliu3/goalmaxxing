import { addDays, format, parseISO } from "date-fns";
import { GAZETTEER } from "@/lib/brand/gazetteer";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";

export const SAMPLE_TODAY = "2026-10-02";
export const SAMPLE_THROUGH = "2027-01-31";

export interface ScheduledSession {
  id: string;
  goalId: string;
  date: string;
  time: string;
  name: string;
  milestone: number | null;
  locked: boolean;
}

function goal(id: string, title: string, patch: Partial<Goal>): Goal {
  return {
    id, title, owner_id: "ux-sample", description: null,
    category: "Personal", color: GAZETTEER.mutedDeep,
    frequency_type: "recurring", recurrence_interval: "weekly",
    target_count: 1, target_basis: "period", milestone_names: null,
    start_date: "2026-09-01", end_date: null, difficulty: "medium",
    is_private: false, default_local_time: null, photo_path: null,
    team_id: null, is_deleted: false, archived_at: null,
    created_at: "2026-09-01T12:00:00Z", updated_at: "2026-09-01T12:00:00Z",
    ...patch,
  };
}

const runMilestones = ["Build the base", "First 10 km", "Find your pace", "Long run · 14 km", "Dress rehearsal", "Race day"];
const portfolioMilestones = Array.from({ length: 30 }, (_, i) =>
  ["Research", "Sketch", "Prototype", "Build", "Write up"][i % 5] + ` · project ${Math.floor(i / 5) + 1}`,
);

export const SAMPLE_GOALS: Goal[] = [
  goal("half", "Run a half marathon", {
    category: "Health", color: GAZETTEER.gain, difficulty: "hard",
    frequency_type: "fixed_milestones", recurrence_interval: null,
    target_count: 6, target_basis: "lifetime", milestone_names: runMilestones,
    end_date: "2026-11-08", default_local_time: "07:30",
    description: "A patient build toward your first race. One meaningful step at a time.",
    reward_text: "A weekend by the coast",
  }),
  goal("strength", "Get stronger", {
    category: "Health", color: GAZETTEER.gain, target_count: 3,
    default_local_time: "18:00", end_date: "2026-12-31",
    description: "Three days a week. Show up, lift well, leave a little in the tank.",
  }),
  goal("japanese", "Speak a little Japanese", {
    recurrence_interval: "daily", difficulty: "easy", is_private: true,
    default_local_time: "08:15",
    description: "A little conversation, every day. An ongoing practice, with no finish line.",
  }),
  goal("portfolio", "Build my design portfolio", {
    category: "Career", color: GAZETTEER.stamp, difficulty: "hard",
    frequency_type: "fixed_milestones", recurrence_interval: null,
    target_count: 30, target_basis: "lifetime", milestone_names: portfolioMilestones,
    end_date: "2027-01-31", default_local_time: "12:30",
    description: "Six projects, from the first sketch to a story worth sharing.",
  }),
  goal("dinner", "Make time for family", {
    category: "Relationships", color: GAZETTEER.colRust, difficulty: "easy",
    default_local_time: "19:00",
    description: "Sunday dinner. Phones away, something warm on the table.",
  }),
];

export function createSample() {
  const sessions: ScheduledSession[] = [];
  const put = (g: Goal, date: string, index: number, name: string, milestone: number | null = null) => {
    sessions.push({ id: `${g.id}-${index}`, goalId: g.id, date,
      time: g.default_local_time ?? "", name, milestone,
      locked: g.id === "half" && milestone === 6 });
  };
  const [half, strength, japanese, portfolio, dinner] = SAMPLE_GOALS;
  ["2026-09-20", "2026-09-27", "2026-10-02", "2026-10-11", "2026-10-25", "2026-11-08"].forEach((date, i) => put(half, date, i, runMilestones[i], i + 1));
  portfolioMilestones.forEach((name, i) => put(portfolio, format(addDays(parseISO("2026-09-28"), i * 4), "yyyy-MM-dd"), i, name, i + 1));
  for (let i = 0; i <= 125; i++) {
    const day = addDays(parseISO("2026-09-28"), i);
    const date = format(day, "yyyy-MM-dd");
    if (date > SAMPLE_THROUGH) break;
    const dow = day.getDay();
    put(japanese, date, i, "Daily practice");
    if ([1, 3, 5].includes(dow) && date <= strength.end_date!) put(strength, date, i, ["Pull & carry", "Squat & press", "Full body"][Math.floor(dow / 2)]);
    if (dow === 0) put(dinner, date, i, "Sunday dinner");
  }
  const facts: CompletionDateFact[] = sessions
    .filter(s => s.date < SAMPLE_TODAY && !(s.goalId === "strength" && s.date === "2026-09-30"))
    .map(s => ({ goal_id: s.goalId, completed_on: s.date, source: "manual" }));
  return { sessions, facts };
}
