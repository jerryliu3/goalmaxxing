import { z } from "zod";

export const onboardingTourKeySchema = z.enum(["app.tabs", "planner.calendar", "insights.main", "social.main"]);
export type OnboardingTourKey = z.infer<typeof onboardingTourKeySchema>;
const tourStatusSchema = z.enum(["complete", "skipped"]);
export const onboardingProgressSchema = z.object({
  setup_step: z.number().int().min(0).max(3),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  tours: z.object({
    "app.tabs": tourStatusSchema.optional(),
    "planner.calendar": tourStatusSchema.optional(),
    "insights.main": tourStatusSchema.optional(),
    "social.main": tourStatusSchema.optional(),
  }).strict(),
});
export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;
export const emptyOnboardingProgress: OnboardingProgress = { setup_step: 0, completed_at: null, tours: {} };
export const onboardingActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("advance"), step: z.number().int().min(1).max(3) }).strict(),
  z.object({ action: z.literal("complete") }).strict(),
  z.object({ action: z.literal("tour"), key: onboardingTourKeySchema, status: tourStatusSchema }).strict(),
  z.object({ action: z.literal("skip-tours") }).strict(),
]);
export type OnboardingAction = z.infer<typeof onboardingActionSchema>;
