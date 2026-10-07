import { z } from "zod";

const isoDate = z.iso.date();

export const recoveryGoalSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    kind: z.enum(["cadence", "milestone_sequence", "deadline_total"]),
    interval: z.enum(["daily", "weekly", "monthly"]).nullable(),
    endDate: isoDate.nullable(),
    /** Weekdays (0 = Sunday) this goal avoids unless nothing else is open. */
    restDays: z.array(z.number().int().min(0).max(6)),
    /** Days from today on that already hold a completion for this goal. */
    completedDates: z.array(isoDate),
  })
  .strict();

export const recoverySessionSchema = z
  .object({
    /** `${goalId}:${date}`: one session per goal per day. */
    id: z.string().min(1),
    goalId: z.string().min(1),
    unitKey: z.string().min(1),
    date: isoDate,
    label: z.string(),
    status: z.enum(["scheduled", "done", "missed"]),
    locked: z.boolean(),
    /** Missed sessions only: the last day the session can still earn credit. */
    windowEnd: isoDate.nullable(),
  })
  .strict();

export const recoverySnapshotSchema = z
  .object({
    today: isoDate,
    /** Last planned day; nothing is suggested past it. */
    horizonEnd: isoDate,
    blackoutRanges: z.array(z.object({ start: isoDate, end: isoDate }).strict()),
    goals: z.array(recoveryGoalSchema),
    sessions: z.array(recoverySessionSchema),
  })
  .strict();

export type RecoveryGoal = z.infer<typeof recoveryGoalSchema>;
export type RecoverySession = z.infer<typeof recoverySessionSchema>;
export type RecoverySnapshot = z.infer<typeof recoverySnapshotSchema>;

/**
 * Recovery mode's Save: every "Let it go" at once. Moves are not here; they
 * are planner draft commands and save through `/api/planner/save`.
 */
export const recoveryDismissRequestSchema = z
  .object({
    dismissals: z
      .array(z.object({ goalId: z.uuid(), date: isoDate }).strict())
      .min(1)
      .max(200),
  })
  .strict();

export type RecoveryDismissRequest = z.infer<typeof recoveryDismissRequestSchema>;
