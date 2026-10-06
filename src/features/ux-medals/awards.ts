import type { AwardTier } from "@/features/achievements/types";
import {
  resolveTempoCardMaterial,
  type TempoCardMaterial,
} from "@/features/goals/card-material/tempo-card-material";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";
import { getCategoryLabel } from "@/lib/goals/category";
import { createDefaultGoalCreationFields, type GoalCreationFields } from "@/lib/goals/creation-model";
import {
  tierHex,
  type FormKey,
  type MedalDirectionSlug,
  type MedalFamilyKey,
} from "@/features/ux-medals/model";

/**
 * Round 2 seed: concrete awards per family so each system can show its whole
 * mix — earned and honestly locked — instead of one example mark.
 */
export interface Award {
  id: string;
  family: MedalFamilyKey;
  /** The card-style numeral on the face ("12", "03"). */
  figure: string;
  /** Two short lines beside the numeral, as on the card ("weeks" / "on plan"). */
  unit: readonly [string, string];
  /** Readable name: goal title, challenge name, board. */
  title: string;
  /** Short mono label for small faces ("TOP 3", "WON"). */
  label: string;
  /** Accent for system awards… */
  tier: AwardTier;
  /** …unless it is your goal: the category colour always wins. */
  color?: string;
  category?: string;
  /** Goal finishes only: the card's material (by difficulty), so the medal matches its card. */
  material?: TempoCardMaterial;
  reward?: string;
  /** Null while locked. */
  date: string | null;
  /** Honest progress toward a locked award: [done, needed]. */
  progress?: readonly [number, number];
  /** The strongest variant of a family: challenge won, first place, team anchor. */
  top?: boolean;
}

/* ------------------------------------------------------------------ */
/* Goals: the same fields feed the real TempoGoalCard and the medal.    */
/* ------------------------------------------------------------------ */

export interface GoalSeed {
  id: string;
  fields: GoalCreationFields;
  reward: string;
  achievedOn: string | null;
  progress?: readonly [number, number];
}

const fields = (patch: Partial<GoalCreationFields>): GoalCreationFields => ({
  ...createDefaultGoalCreationFields(),
  default_local_time: "",
  ...patch,
});

export const GOAL_SEEDS: readonly GoalSeed[] = [
  {
    id: "thesis",
    fields: fields({
      title: "Defend the thesis.",
      category_selection: "career",
      color: GAZETTEER.stamp,
      target_count: "24",
      target_basis: "lifetime",
      difficulty: "medium",
      start_date: "2026-01-12",
      end_date: "2026-09-01",
    }),
    reward: "A week off the grid in Big Sur.",
    achievedOn: "2026-09-01T16:00:00.000Z",
  },
  {
    id: "half",
    fields: fields({
      title: "Run the autumn half.",
      category_selection: "health",
      color: GAZETTEER.gain,
      recurrence_interval: "weekly",
      target_count: "3",
      difficulty: "easy",
      start_date: "2026-05-04",
      end_date: "2026-07-18",
    }),
    reward: "New trail shoes, the good ones.",
    achievedOn: "2026-07-18T09:30:00.000Z",
  },
  {
    id: "books",
    fields: fields({
      title: "Read twenty books this year.",
      category_selection: "personal",
      color: GAZETTEER.mutedDeep,
      target_count: "20",
      target_basis: "lifetime",
      difficulty: "hard",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    }),
    reward: "A first edition for the shelf.",
    achievedOn: "2026-08-20T20:15:00.000Z",
  },
  {
    id: "sundays",
    fields: fields({
      title: "Call home every Sunday.",
      category_selection: "relationships",
      color: GAZETTEER.colRust,
      recurrence_interval: "weekly",
      target_count: "1",
      difficulty: "easy",
      start_date: "2026-06-07",
      end_date: "2026-09-27",
    }),
    reward: "Dinner out with Mum and Dad.",
    achievedOn: null,
    progress: [9, 16],
  },
];

export const EARNED_GOALS = GOAL_SEEDS.filter((seed) => seed.achievedOn);

/** The card's own unit copy, shortened to two lines. */
function cardUnit(goal: GoalCreationFields): readonly [string, string] {
  const one = Number(goal.target_count) === 1;
  if (goal.target_basis === "lifetime") return [one ? "completion" : "completions", "in total"];
  if (goal.recurrence_interval === "daily") return ["every", "day"];
  return [one ? "day" : "days", goal.recurrence_interval === "weekly" ? "a week" : "a month"];
}

export function goalAward(seed: GoalSeed): Award {
  const goal = seed.fields;
  const category = getCategoryLabel(goal.category_selection, goal.custom_category);
  return {
    id: `goal-${seed.id}`,
    family: "goal",
    figure: String(Number(goal.target_count) || 1).padStart(2, "0"),
    unit: cardUnit(goal),
    title: goal.title,
    label: category.toUpperCase(),
    tier: "bronze",
    color: goal.color,
    category,
    material: resolveTempoCardMaterial(goal.difficulty),
    reward: seed.reward,
    date: seed.achievedOn,
    progress: seed.progress,
  };
}

/* ------------------------------------------------------------------ */
/* System families.                                                     */
/* ------------------------------------------------------------------ */

const streak = (weeks: number, date: string | null): Award => ({
  id: `streak-${weeks}`,
  family: "streak",
  figure: String(weeks).padStart(2, "0"),
  unit: ["weeks", "on plan"],
  title: `${weeks} weeks on plan`,
  label: `${weeks} WK`,
  tier: "sage",
  date,
  progress: date ? undefined : [19, weeks],
});

export const AWARDS: Record<MedalFamilyKey, readonly Award[]> = {
  goal: GOAL_SEEDS.map(goalAward),
  streak: [
    streak(4, "2026-04-06T08:00:00.000Z"),
    streak(12, "2026-06-29T08:00:00.000Z"),
    streak(26, null),
    streak(52, null),
  ],
  challenge: [
    {
      id: "climb",
      family: "challenge",
      figure: "30",
      unit: ["days", "completed"],
      title: "30-day climb",
      label: "DONE",
      tier: "copper",
      date: "2026-05-30T19:00:00.000Z",
    },
    {
      id: "spring-5k",
      family: "challenge",
      figure: "21",
      unit: ["days", "and won"],
      title: "Spring 5K block",
      label: "WON",
      tier: "copper",
      date: "2026-04-21T19:00:00.000Z",
      top: true,
    },
    {
      id: "mornings",
      family: "challenge",
      figure: "14",
      unit: ["days", "to go"],
      title: "Quiet mornings",
      label: "9 / 14",
      tier: "copper",
      date: null,
      progress: [9, 14],
    },
  ],
  leaderboard: [
    {
      id: "board-31",
      family: "leaderboard",
      figure: "10",
      unit: ["top", "week 31"],
      title: "Ridge club · week 31",
      label: "TOP 10",
      tier: "gold",
      date: "2026-08-02T21:00:00.000Z",
    },
    {
      id: "board-36",
      family: "leaderboard",
      figure: "3",
      unit: ["top", "week 36"],
      title: "Ridge club · week 36",
      label: "TOP 3",
      tier: "gold",
      date: "2026-09-06T21:00:00.000Z",
    },
    {
      id: "board-first",
      family: "leaderboard",
      figure: "1",
      unit: ["first", "any week"],
      title: "First on a weekly board",
      label: "1ST",
      tier: "gold",
      date: null,
      top: true,
    },
  ],
  team: [
    {
      id: "ridge-member",
      family: "team",
      figure: "12",
      unit: ["members", "together"],
      title: "Ridge club · Summit by September",
      label: "MEMBER",
      tier: "ink",
      date: "2026-09-14T18:00:00.000Z",
    },
    {
      id: "ridge-anchor",
      family: "team",
      figure: "12",
      unit: ["members", "you anchor"],
      title: "Anchor a club goal",
      label: "ANCHOR",
      tier: "ink",
      date: null,
      top: true,
    },
  ],
};

/** The representative earned award each family shows in matrices and pairings. */
export const FAMILY_EXAMPLE: Record<MedalFamilyKey, Award> = {
  goal: AWARDS.goal[0]!,
  streak: AWARDS.streak[1]!,
  challenge: AWARDS.challenge[1]!,
  leaderboard: AWARDS.leaderboard[1]!,
  team: AWARDS.team[0]!,
};

export function awardFor(family: MedalFamilyKey, award?: Award) {
  return award ?? FAMILY_EXAMPLE[family];
}

/** Physical accent (tiles, tokens): the category colour, else the tier's light-paper ink. */
export function awardHex(award: Award) {
  return award.color ?? tierHex(award.tier);
}

export function awardStatus(award: Award) {
  if (award.date) return shortDate(award.date);
  return award.progress ? `${award.progress[0]} / ${award.progress[1]}` : "NOT YET";
}

/** Compact UTC date for medal faces: "01 SEP 26". */
export function shortDate(value: string) {
  const date = new Date(value);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return `${day} ${month} ${String(date.getUTCFullYear()).slice(2)}`;
}

/**
 * The cross-system mix: each family takes the form that does its job best.
 * Round 3 builds exactly these forms in premium materials.
 */
export const PROPOSED_MIX: Record<FormKey, MedalDirectionSlug> = {
  level: "token",
  goal: "tile",
  streak: "token",
  challenge: "token",
  leaderboard: "mark",
  team: "mark",
};
