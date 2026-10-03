import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type { GoalFolio } from "@/features/insights/folio/folio-model";
import { MATERIAL_SAMPLES } from "../card-materials/materials";

export type PlaquePhase = "whole" | "etched" | "released" | "ghost" | "almost" | "gather" | "fused";
export type CeremonyPhase = "lift" | "gather" | "seal" | "celebrate" | "shelve" | "kept";

export const REVIEW_BEATS = {
  whole: { delay: 320, next: "etched" },
  etched: { delay: 480, next: "released" },
  released: { delay: 850, next: "ghost" },
} as const;

export const CEREMONY_BEATS = {
  lift: { delay: 720, next: "gather" },
  gather: { delay: 1050, next: "seal" },
  seal: { delay: 420, next: "celebrate" },
  shelve: { delay: 1500, next: "kept" },
} as const;

export function studyFields(target: number, difficulty: GoalCreationFields["difficulty"]): GoalCreationFields {
  return { ...MATERIAL_SAMPLES[1].fields, title: "Build something worth sharing.", target_count: String(target),
    difficulty, start_date: "2026-09-01", end_date: "" };
}

/** A finite, achieved sample. No production eligibility is inferred by the study. */
export function studyFolio(fields: GoalCreationFields): GoalFolio {
  const count = Number(fields.target_count);
  return { year: "2026", completions: count, entries: [{
    fields, closedOn: "2026-09-18", status: "Completed",
    goal: { id: "motion-study", owner_id: "sample", title: fields.title, description: null,
      category: fields.category_selection, color: fields.color, frequency_type: fields.frequency_type,
      recurrence_interval: fields.recurrence_interval, difficulty: fields.difficulty, target_count: count,
      target_basis: "lifetime", milestone_names: null, start_date: fields.start_date, end_date: null,
      photo_path: null, team_id: null, is_deleted: false, archived_at: null, created_at: "2026-09-01", updated_at: "2026-09-18" },
    progress: { goalId: "motion-study", admissibleCompletionCount: count, creditedUnitCount: count,
      expectedUnitCount: count, percent: 100, lifecycle: "active", outcome: "achieved", placementTerminal: true,
      achievementDate: "2026-09-18", periodSatisfied: true, currentPeriodCompletionCount: count,
      currentPeriodTarget: null, closedPeriodHitRatePercent: null, currentStreak: 0, longestStreak: 0, milestoneDates: [] },
  }] };
}
