import { z } from "zod";
import { plannerGoalSchema } from "@/lib/planner/contracts/kernel-schema";
import { contextQuerySchema, previewRequestSchema, publishSchema } from "@/lib/planner/contracts/requests";
import { plannerPolicySchema } from "@/lib/planner/policy";
import { plannerLocalTimeSchema } from "@/lib/planner/schedule-time";
import { targetedExactDateRequestSchema } from "@/lib/planner/exact-date-dispatch";
import { calendarTasksQuerySchema, plannerTaskCompletionRequestSchema, plannerTaskScheduleRequestSchema } from "@/lib/tasks/calendar-tasks";
import { validateGoalDefinition } from "@/lib/goals/definition-validation";
import { MAX_GOAL_TARGET_COUNT } from "@/lib/planner/contracts/bounds";

export const externalGoalRowSchema = plannerGoalSchema.extend({
  category_key: z.string(), reward_text: z.string().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]), is_private: z.boolean(),
  plaque_target: z.number().int().positive().nullable(),
});
export const goalDefinitionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).nullable().default(null),
  rewardText: z.string().max(1_000).nullable().default(null),
  category: z.string().trim().min(1).max(100).default("Personal"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
  frequencyType: z.enum(["recurring", "fixed_milestones"]),
  recurrenceInterval: z.enum(["daily", "weekly", "monthly"]).nullable().default(null),
  targetCount: z.number().int().positive().max(MAX_GOAL_TARGET_COUNT).nullable().default(null),
  targetBasis: z.enum(["period", "lifetime"]).default("period"),
  milestoneNames: z.array(z.string().trim().max(1_000)).max(MAX_GOAL_TARGET_COUNT).nullable().default(null),
  startDate: z.iso.date(), endDate: z.iso.date().nullable().default(null),
  defaultLocalTime: plannerLocalTimeSchema.nullable().default(null),
  teamId: z.uuid().nullable().default(null), isPrivate: z.boolean().default(true),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  plaqueTarget: z.number().int().positive().max(MAX_GOAL_TARGET_COUNT).nullable().default(null),
}).strict().superRefine((goal, ctx) => {
  if (goal.frequencyType === "recurring" && !goal.recurrenceInterval) ctx.addIssue({ code: "custom", message: "Recurring goals require recurrenceInterval.", path: ["recurrenceInterval"] });
  if (goal.frequencyType === "fixed_milestones" && (!goal.targetCount || goal.recurrenceInterval !== null)) ctx.addIssue({ code: "custom", message: "Milestone goals require targetCount and no recurrenceInterval.", path: ["targetCount"] });
  if (goal.milestoneNames && (goal.frequencyType !== "fixed_milestones" || goal.milestoneNames.length !== goal.targetCount)) ctx.addIssue({ code: "custom", message: "milestoneNames must match the milestone targetCount.", path: ["milestoneNames"] });
  if (goal.frequencyType === "recurring" && goal.targetBasis === "lifetime" && !goal.targetCount) ctx.addIssue({ code: "custom", message: "Lifetime goals require targetCount.", path: ["targetCount"] });
  for (const issue of validateGoalDefinition({ frequencyType: goal.frequencyType, recurrenceInterval: goal.recurrenceInterval, targetCount: goal.targetCount, targetBasis: goal.targetBasis, startDate: goal.startDate, endDate: goal.endDate })) {
    if (issue.code !== "target_exceeds_capacity") ctx.addIssue({ code: "custom", message: issue.message });
  }
});
const requestId = z.uuid().describe("Stable UUID for this logical mutation. Reuse unchanged when retrying; use a new UUID for a different edit.");
const goalId = z.uuid();
const expectedUpdatedAt = z.iso.datetime({ offset: true }).describe("Exact updated_at from get_goal; prevents overwriting a newer edit.");
export const operationSchemas = {
  get_account: z.object({}).strict(),
  list_goals: z.object({ limit: z.number().int().min(1).max(100).default(50), after: z.uuid().optional(), includeArchived: z.boolean().default(false) }).strict(),
  get_goal: z.object({ goalId }).strict(),
  create_goal: z.object({ requestId, goal: goalDefinitionSchema }).strict(),
  update_goal: z.object({ requestId, goalId, expectedUpdatedAt, goal: goalDefinitionSchema }).strict(),
  set_goal_archived: z.object({ requestId, goalId, expectedUpdatedAt, archived: z.boolean() }).strict(),
  set_goal_link: z.object({ requestId, goalId, expectedUpdatedAt, targetGoalId: z.uuid().nullable() }).strict(),
  get_progress: z.object({ viewDate: z.iso.date().optional(), factsFrom: z.iso.date().optional(), factsTo: z.iso.date().optional() }).strict().refine(v => Boolean(v.factsFrom) === Boolean(v.factsTo), "Supply both fact-window dates.").refine(v => !(v.viewDate && v.factsFrom), "Choose a view date or a fact window."),
  get_plan: contextQuerySchema.strict(),
  preview_plan: previewRequestSchema.safeExtend({ policy: plannerPolicySchema.optional() }).strict(),
  publish_plan: publishSchema.safeExtend({ policy: plannerPolicySchema.optional() }).strict(),
  set_completion: targetedExactDateRequestSchema,
  list_tasks: calendarTasksQuerySchema.strict(),
  create_task: z.object({ requestId, title: z.string().trim().min(1).max(200), scheduledDate: z.iso.date(), scheduledTime: plannerLocalTimeSchema.nullable().default(null) }).strict(),
  set_task_schedule: plannerTaskScheduleRequestSchema.extend({ taskId: z.uuid() }).strict(),
  set_task_completion: plannerTaskCompletionRequestSchema.extend({ taskId: z.uuid() }).strict(),
} as const;
export type OperationName = keyof typeof operationSchemas;
export type GoalDefinition = z.infer<typeof goalDefinitionSchema>;
