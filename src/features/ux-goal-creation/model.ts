import { format, lastDayOfMonth } from "date-fns";
import { categoryChangePatch } from "@/lib/goals/card-colour";
import type { CategoryPresetId } from "@/lib/goals/category";
import { toLocalDateString } from "@/lib/dates/day";
import { getGoalCreationPeriodTargetMax } from "@/lib/goals/creation-model";
import type { RecurrenceInterval } from "@/lib/goals/types";
import type { CardFact, FaceFact } from "@/features/goals/card-editor/card-facts";
import type { TempoChoicesMade } from "@/features/goals/tempo-creation-progress";
import {
  applyGoalFormCreateKindChange,
  applyGoalFormFieldChange,
  defaultGoalFormState,
  type GoalFormState,
} from "@/features/today/goal-form-model";

export type GoalCreationConceptSlug = "blank-card" | "stamp" | "say-it";

export interface CreationFlowSummary {
  name: string;
  steps: string;
  decisions: string;
  reward: string;
  locked: string;
  review: string;
}

export interface GoalCreationConcept extends CreationFlowSummary {
  slug: GoalCreationConceptSlug;
  letter: string;
  thesis: string;
  moments: string[];
  risk: string;
}

export const GOAL_CREATION_CONCEPTS: readonly GoalCreationConcept[] = [
  {
    slug: "blank-card",
    letter: "A",
    name: "Blank card",
    thesis: "Creating is editing a blank card. Ask only the name and the one locked choice; the card fills the rest with defaults you fix in place.",
    moments: ["Name it on the card", "Choose the rhythm (locked)", "Adjust on the card", "Turn over: why + reward"],
    steps: "3 moments",
    decisions: "2 asked · the rest defaulted",
    reward: "Card back, during the turn-over",
    locked: "Rhythm gets its own moment and says so",
    review: "None — the card is the review",
    risk: "Defaults can be accepted without a look; the nudge has to be gentle but visible.",
  },
  {
    slug: "stamp",
    letter: "B",
    name: "Stamp by stamp",
    thesis: "One question at a time, but every answer stamps onto the region of the card it fills. Stamped regions stay editable with the edit card's own controls.",
    moments: ["Name", "Rhythm (locked)", "Category", "Effort", "When", "Why", "Sealed reward"],
    steps: "7 beats",
    decisions: "7 asked · 2 skippable",
    reward: "Final beat: a sealed envelope",
    locked: "Rhythm beat carries the lock",
    review: "The fully stamped card",
    risk: "Longest path; the guided pace can feel slow to someone who knows what they want.",
  },
  {
    slug: "say-it",
    letter: "C",
    name: "Say it",
    thesis: "Say the goal in one sentence. The card fills from what you said — reward included — and you tweak it with the edit card's controls.",
    moments: ["Say it in a sentence", "Confirm the rhythm (locked)", "Tweak on the card"],
    steps: "2 moments",
    decisions: "1 sentence + 1 confirm",
    reward: "Parsed from the sentence, confirmed in a chip",
    locked: "Parsed rhythm is shown as locked before Create",
    review: "None — the filled card is the review",
    risk: "Real parsing is AI-backed; a wrong guess on the locked rhythm is the costly miss.",
  },
];

export const TODAY_FLOW: CreationFlowSummary = {
  name: "Today",
  steps: "5 steps",
  decisions: "~10 asked",
  reward: "Not asked — only on the edit card's back",
  locked: "Rhythm, with no warning that it's final",
  review: "Read-only labelled card",
};

export const WHAT_CHANGES: readonly string[] = [
  "Creation and editing share one set of controls: the annotated card, the direct card, inline facts and the card back.",
  "The separate review step goes away; the card you build is the card you review.",
  "Rhythm — the only choice update_goal rejects later — is named as locked at the moment you make it.",
  "The reward (existing reward_text) is asked for during creation, and shows as a sealed mark on the new card.",
  "Category, effort, start, deadline and time default instead of being asked; each stays one tap away on the card.",
];

export function getGoalCreationConcept(slug: GoalCreationConceptSlug): GoalCreationConcept {
  return GOAL_CREATION_CONCEPTS.find((concept) => concept.slug === slug)!;
}

export const EXAMPLE_SENTENCES: readonly string[] = [
  "Run a half marathon by March, 3 runs a week, then buy a new bike",
  "Read 12 books this year, 20 minutes every day at 9pm, then treat myself to a weekend away",
  "Call Mom twice a week in the evenings",
];

export const REWARD_SUGGESTIONS: readonly string[] = ["New running shoes", "A weekend away"];

const CATEGORY_KEYWORDS: readonly [CategoryPresetId, RegExp][] = [
  ["health", /\b(run|runs|running|marathon|5k|10k|gym|lift|lifting|workout|yoga|swim|cycle|cycling|walk|walks|steps|sleep|meditate|meditation|water|healthy|weight|fitness|hike|pilates)\b/i],
  ["career", /\b(work|job|career|promotion|interview|resume|portfolio|ship|launch|clients?|business|startup|code|coding|course|certification|network)\b/i],
  ["relationships", /\b(mom|mum|dad|parents|family|friends?|partner|wife|husband|kids|date|call|visit|grandma|grandpa|brother|sister)\b/i],
  ["personal", /\b(read|books?|journal|write|writing|learn|language|spanish|french|guitar|piano|draw|paint|practice|save|budget|declutter)\b/i],
];

/** A tiny keyword guess for the card's category; anything unmatched is Personal. */
export function guessCategory(text: string): CategoryPresetId {
  return CATEGORY_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? "personal";
}

/** The defaults a named card fills with: guessed category, a good push, from today, open-ended, any time. */
export function filledDefaults(fields: GoalFormState, today = new Date()): GoalFormState {
  return {
    ...fields,
    ...categoryChangePatch(fields, guessCategory(fields.title)),
    difficulty: "medium",
    start_date: toLocalDateString(today),
    end_date: "",
    default_local_time: "",
  };
}

/** Whether the rhythm picker has every answer it needs (it discloses one question at a time). */
export function rhythmComplete(chosen: Pick<TempoChoicesMade, "kind" | "interval" | "basis" | "count">, fields: GoalFormState) {
  if (!chosen.kind) return false;
  if (fields.frequency_type === "fixed_milestones") return chosen.count;
  return chosen.interval && chosen.basis && chosen.count;
}

export const RHYTHM_CHOSEN: TempoChoicesMade = { category: true, kind: true, interval: true, basis: true, count: true, difficulty: true };
export const RHYTHM_UNCHOSEN: TempoChoicesMade = { category: false, kind: false, interval: false, basis: false, count: false, difficulty: false };

/** Empty, optional facts the blank card points at next, in order. Face first, then the back. */
export const NUDGE_ORDER = ["deadline", "time", "description", "reward"] as const satisfies readonly CardFact[];
export type NudgeFact = (typeof NUDGE_ORDER)[number];

const NUDGE_VALUE: Record<NudgeFact, (fields: GoalFormState) => string> = {
  deadline: (fields) => fields.end_date,
  time: (fields) => fields.default_local_time,
  description: (fields) => fields.description,
  reward: (fields) => fields.reward_text,
};

export function nextEmptyFact(fields: GoalFormState, skipped: ReadonlySet<NudgeFact>): NudgeFact | null {
  return NUDGE_ORDER.find((fact) => !skipped.has(fact) && !NUDGE_VALUE[fact](fields).trim()) ?? null;
}

// ── Fake sentence parser (deterministic, no network) ────────────────────────────

const NUMBER_WORDS: Record<string, number> = { once: 1, one: 1, twice: 2, two: 2, three: 3, four: 4, five: 5, six: 6 };
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const REWARD = /(?:,\s*|\s+)(?:and\s+)?(?:then|reward(?:ing)?(?:\s+myself)?(?:\s+with)?|treat(?:ing)?\s+(?:myself|me)\s+to)\s+(.+)$/i;
const PER_PERIOD = /\b(\d+|once|twice|one|two|three|four|five|six)\s*(?:x\s*|times\s+|[a-z]+\s+)?(?:a|per|each|every)\s+(week|month)\b/i;
const LIFETIME = /\b(\d+)\s+(?:[a-z]+\s+)?(?:times\s+)?in\s+total\b/i;
const MILESTONES = /\b(\d+)\s+(?:milestones|stages|chapters)\b/i;
const DAILY = /\b(?:every\s*day|daily|each\s+day|every\s+(?:morning|evening|night))\b/i;
const BY_MONTH = /\bby\s+(?:the\s+end\s+of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s+(\d{1,2})\b)?/i;
const BY_ISO = /\bby\s+(\d{4}-\d{2}-\d{2})\b/;
const THIS_YEAR = /\b(?:this|by the end of the|by end of)\s+year\b/i;
const AT_TIME = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const MORNINGS = /\b(?:in\s+the\s+)?mornings?\b/i;
const EVENINGS = /\b(?:in\s+the\s+)?(?:evenings?|nights?)\b/i;
const EASY = /\b(?:easy|gentle|small|light)\b/i;
const HARD = /\b(?:hard|ambitious|intense|big)\b/i;

export interface ParsedGoal {
  fields: GoalFormState;
  /** Facts the sentence supplied, so the card can say what it read. */
  read: (FaceFact | "reward")[];
  /** False when no rhythm was found; the locked choice then still needs asking. */
  rhythmRead: boolean;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function deadlineFrom(text: string, today: Date): { date: string; index: number } | null {
  const iso = BY_ISO.exec(text);
  if (iso) return { date: iso[1], index: iso.index };
  const year = THIS_YEAR.exec(text);
  if (year) return { date: `${today.getFullYear()}-12-31`, index: year.index };
  const month = BY_MONTH.exec(text);
  if (!month) return null;
  const monthIndex = MONTHS.indexOf(month[1].toLowerCase());
  const day = month[2] ? Number(month[2]) : null;
  // The next time that month (and day) comes round, counting today.
  const passed = monthIndex < today.getMonth() || (monthIndex === today.getMonth() && day !== null && day < today.getDate());
  const target = new Date(today.getFullYear() + (passed ? 1 : 0), monthIndex, 1);
  const date = day ? new Date(target.getFullYear(), monthIndex, Math.min(day, lastDayOfMonth(target).getDate())) : lastDayOfMonth(target);
  return { date: format(date, "yyyy-MM-dd"), index: month.index };
}

function timeFrom(text: string): { time: string; index: number } | null {
  const at = AT_TIME.exec(text);
  if (at) {
    const hour = (Number(at[1]) % 12) + (at[3].toLowerCase() === "pm" ? 12 : 0);
    return { time: `${String(hour).padStart(2, "0")}:${at[2] ?? "00"}`, index: at.index };
  }
  const morning = MORNINGS.exec(text);
  if (morning) return { time: "07:00", index: morning.index };
  const evening = EVENINGS.exec(text);
  if (evening) return { time: "19:00", index: evening.index };
  return null;
}

/**
 * A stand-in for the AI parse: keyword and pattern matching over one sentence. It fills a
 * creation draft through the canonical form model, so clamping and milestone names match
 * what the real flow would produce.
 */
export function parseGoalSentence(sentence: string, base: GoalFormState = defaultGoalFormState, today = new Date()): ParsedGoal {
  let text = sentence.trim().replace(/[.!]+$/, "");
  let fields: GoalFormState = { ...base, start_date: toLocalDateString(today) };
  const read: ParsedGoal["read"] = [];
  const cuts: number[] = [];

  const reward = REWARD.exec(text);
  if (reward) {
    const cleaned = reward[1].trim().replace(/^(?:i(?:'|’)ll|i will)\s+/i, "").replace(/^treat(?:ing)?\s+(?:myself|me)\s+to\s+/i, "");
    fields.reward_text = capitalize(cleaned);
    read.push("reward");
    text = text.slice(0, reward.index);
  }

  const comma = text.indexOf(",");
  if (comma > 0) cuts.push(comma);

  const period = PER_PERIOD.exec(text);
  const lifetime = period ? null : LIFETIME.exec(text);
  const milestones = period || lifetime ? null : MILESTONES.exec(text);
  const daily = period || lifetime || milestones ? null : DAILY.exec(text);
  if (period) {
    const interval = period[2].toLowerCase() === "week" ? "weekly" : "monthly";
    const count = Number(period[1]) || NUMBER_WORDS[period[1].toLowerCase()] || 1;
    fields = withRhythm(fields, interval, "period", Math.min(count, getGoalCreationPeriodTargetMax(interval)));
    cuts.push(period.index);
  } else if (lifetime) {
    fields = withRhythm(fields, "weekly", "lifetime", Number(lifetime[1]));
    cuts.push(lifetime.index);
  } else if (milestones) {
    fields = applyGoalFormCreateKindChange(fields, "fixed_milestones");
    fields = applyGoalFormFieldChange(fields, { type: "target_count", value: milestones[1] });
    cuts.push(milestones.index);
  } else if (daily) {
    fields = withRhythm(fields, "daily", "period", 1);
    cuts.push(daily.index);
  }
  const rhythmRead = Boolean(period || lifetime || milestones || daily);
  if (rhythmRead) read.push("cadence");

  const deadline = deadlineFrom(text, today);
  if (deadline) {
    fields.end_date = deadline.date;
    read.push("deadline");
    cuts.push(deadline.index);
  }
  const time = timeFrom(text);
  if (time) {
    fields.default_local_time = time.time;
    read.push("time");
    cuts.push(time.index);
  }
  if (EASY.test(text)) fields.difficulty = "easy";
  else if (HARD.test(text)) fields.difficulty = "hard";
  if (fields.difficulty !== base.difficulty) read.push("difficulty");

  const title = text
    .slice(0, cuts.length ? Math.min(...cuts) : text.length)
    .replace(/[\s,;:-]+$/, "")
    // "Write a novel in 5 chapters" leaves a dangling "in".
    .replace(/\s+(?:in|by|at|with|for|and|then)$/i, "")
    .trim();
  if (title) {
    fields.title = capitalize(title);
    read.unshift("name");
  }
  const category = guessCategory(text);
  fields = { ...fields, ...categoryChangePatch(fields, category) };
  if (category !== base.category_selection) read.push("category");

  return { fields, read, rhythmRead };
}

function withRhythm(fields: GoalFormState, interval: RecurrenceInterval, basis: "period" | "lifetime", count: number): GoalFormState {
  let next = applyGoalFormCreateKindChange(fields, "recurring");
  next = applyGoalFormFieldChange(next, { type: "recurrence_interval", value: interval });
  next = applyGoalFormFieldChange(next, { type: "target_basis", value: basis });
  return applyGoalFormFieldChange(next, { type: "target_count", value: String(count) });
}
