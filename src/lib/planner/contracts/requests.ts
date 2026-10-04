import { z } from "zod";
import { isValidIanaTimezone } from "@/lib/dates/timezone";
import { assertDateWindow } from "@/lib/planner/dates";
import { plannerDraftCommandSchema } from "@/lib/planner/draft-commands";
import { PLANNER_ELIGIBILITY_MODES } from "./bounds";

export const contextQuerySchema = z.object({
  scopeMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .refine((month) => {
      const monthNumber = Number(month.slice(5, 7));
      return monthNumber >= 1 && monthNumber <= 12;
    }, "Invalid scope month."),
  asOfDate: z.iso.date().optional(),
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(isValidIanaTimezone)
    .optional(),
  visibleStart: z.iso.date().optional(),
  visibleEnd: z.iso.date().optional(),
});

export const previewRequestSchema = z
  .object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    asOfDate: z.iso.date().optional(),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(isValidIanaTimezone)
      .optional(),
    policy: z.unknown().optional(),
    source: z.enum(["manual", "ai", "update"]).default("manual"),
    /**
     * `replan` is a proposal-generation mode: the caller diffs the result against
     * the current preview, turns the differences into `move_item` draft commands,
     * then re-requests a `stable` preview pinned to those commands. A `replan`
     * preview must never be stored as the draft or sent to save; the save route
     * always solves `stable`, so its hash would not match.
     */
    solveIntent: z.enum(["stable", "replan"]).default("stable"),
    /**
     * Recovery is the same proposal shape as `replan`, for a different question:
     * where would uncredited sessions whose saved date has already passed go if
     * the solver were free to re-place them? The caller diffs it against a plain
     * preview over the same window and pins the differences. Never stored as the
     * draft, never sent to save.
     */
    recoverPastPlacements: z.boolean().default(false),
    draftCommands: z.array(plannerDraftCommandSchema).max(4000).default([]),
  })
  .superRefine((value, ctx) => {
    try {
      assertDateWindow({ start: value.startDate, end: value.endDate });
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error ? error.message : "Invalid planner window.",
        path: ["endDate"],
      });
    }
  });

export const publishSchema = z
  .object({
    expectedDigest: z.string().regex(/^[a-f0-9]{64}$/),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    previewHash: z.string().regex(/^[a-f0-9]{64}$/),
    confirmationHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    policy: z.unknown().optional(),
    eligibilityMode: z.enum(PLANNER_ELIGIBILITY_MODES).optional(),
    draftCommands: z.array(plannerDraftCommandSchema).max(4000).default([]),
    preserveExistingAssignments: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    try {
      assertDateWindow({ start: value.startDate, end: value.endDate });
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error ? error.message : "Invalid planner window.",
        path: ["endDate"],
      });
    }
  });

