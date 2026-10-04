import { z } from "zod";
export { coachActionPreviewLines, coachActionPreviewSchema } from "./action-preview";

export const coachPageSchema = z.object({
  surface: z.enum(["plan", "checklist", "progress", "community", "you", "goal", "coach"]),
  view: z.enum(["day", "three_day", "week", "month", "goals", "year"]).optional(),
  selectedDate: z.iso.date().optional(),
  selectedGoalId: z.uuid().optional(),
  selectedItemId: z.uuid().optional(),
  selectedTaskId: z.uuid().optional(),
  scope: z.enum(["self", "duo"]).default("self"),
  hasDraft: z.boolean().default(false),
}).strict();
export type CoachPage = z.infer<typeof coachPageSchema>;
export const coachTopicSchema = z.object({
  id: z.uuid(), owner_id: z.uuid(), title: z.string().min(1).max(120),
  intention: z.string().max(1000), summary: z.string().max(4000),
  summary_sources: z.array(z.uuid()).default([]), summary_updated_at: z.string().nullable().default(null),
  version: z.number().int().nonnegative(), is_default: z.boolean(),
  archived_at: z.string().nullable(), created_at: z.string(), updated_at: z.string(),
});
export const coachThreadSchema = z.object({
  id: z.uuid(), owner_id: z.uuid(), topic_id: z.uuid(), title: z.string().min(1).max(120),
  version: z.number().int().nonnegative(), archived_at: z.string().nullable(),
  created_at: z.string(), updated_at: z.string(), legacy_conversation_id: z.string().nullable(),
});
export const coachMessageSchema = z.object({
  id: z.uuid(), owner_id: z.uuid(), thread_id: z.uuid(), sequence: z.number().int().positive(),
  role: z.enum(["user", "assistant"]), content: z.string().max(16000),
  run_id: z.uuid().nullable(), source: z.record(z.string(), z.unknown()), created_at: z.string(),
});
export const coachMemorySchema = z.object({
  id: z.uuid(), owner_id: z.uuid(), topic_id: z.uuid().nullable(),
  content: z.string().min(1).max(1000), kind: z.enum(["preference", "observation"]),
  source_message_id: z.uuid().nullable(), version: z.number().int().nonnegative(),
  created_at: z.string(), updated_at: z.string(),
});
export const coachRunSchema = z.object({
  id: z.uuid(), owner_id: z.uuid(), thread_id: z.uuid(),
  status: z.enum(["running", "completed", "failed", "cancelled"]),
  user_message_id: z.uuid(), topic_version: z.number().int().nonnegative(), error_code: z.string().nullable(),
  context_revision: z.string().nullable(), created_at: z.string(), deadline: z.string(),
  completed_at: z.string().nullable(),
});
export const coachActionSchema = z.object({
  id: z.uuid(), owner_id: z.uuid(), thread_id: z.uuid(), run_id: z.uuid(),
  kind: z.string(), title: z.string(), preview: z.record(z.string(), z.unknown()),
  status: z.enum(["proposed", "applied", "rejected", "superseded", "undone"]),
  result: z.record(z.string(), z.unknown()).nullable(), created_at: z.string(),
  applied_at: z.string().nullable(), inverse_of: z.uuid().nullable(),
});
export const coachTurnRequestSchema = z.object({
  requestId: z.uuid(), expectedVersion: z.number().int().nonnegative(),
  message: z.string().trim().min(1).max(12000), page: coachPageSchema,
  retryRunId: z.uuid().optional(),
  checkIn: z.object({ kind: z.enum(["daily", "weekly", "monthly"]), periodKey: z.iso.date() }).strict().optional(),
}).strict();
export const coachTopicCreateSchema = z.object({ title: z.string().trim().min(1).max(120) }).strict();
export const coachEntityPatchSchema = z.object({
  version: z.number().int().nonnegative(), title: z.string().trim().min(1).max(120).optional(),
  archived: z.boolean().optional(), intention: z.string().trim().max(1000).optional(),
}).strict();
export const coachMemoryInputSchema = z.object({
  topicId: z.uuid().nullable(), content: z.string().trim().min(1).max(1000),
  kind: z.enum(["preference", "observation"]).default("preference"),
  sourceMessageId: z.uuid().optional(),
}).strict();
export type CoachTopic = z.infer<typeof coachTopicSchema>;
export type CoachThread = z.infer<typeof coachThreadSchema>;
export type CoachMessage = z.infer<typeof coachMessageSchema>;
export type CoachMemory = z.infer<typeof coachMemorySchema>;
export type CoachRun = z.infer<typeof coachRunSchema>;
export type CoachAction = z.infer<typeof coachActionSchema>;
export type CoachTurnRequest = z.infer<typeof coachTurnRequestSchema>;

export const coachSessionSchema = z.object({
  id:z.uuid(), goalId:z.uuid(), title:z.string(), unitKey:z.string(), date:z.iso.date(),
  completed:z.boolean(), locked:z.boolean(),
});
export const coachContextSchema = z.object({
  schemaVersion:z.literal(1), asOf:z.string(), revision:z.string(), timezone:z.string(), timezoneConfirmed:z.boolean(),
  today:z.object({date:z.iso.date(),scheduled:z.number(),completed:z.number(),allCompletions:z.number()}),
  week:z.object({start:z.iso.date(),end:z.iso.date(),weekStartsOn:z.number(),scheduled:z.number(),completed:z.number(),allCompletions:z.number()}),
  page:coachPageSchema, pagePurpose:z.string(), scopeNote:z.string(),
  sessions:z.array(coachSessionSchema),
  tasks:z.array(z.object({id:z.uuid(),title:z.string(),date:z.iso.date(),completed:z.boolean(),updatedAt:z.string()})),
  goals:z.array(z.object({id:z.uuid(),title:z.string(),startDate:z.iso.date(),endDate:z.iso.date().nullable(),frequency:z.string(),recurrenceInterval:z.string().nullable(),targetBasis:z.string().nullable(),description:z.string().nullable(),target:z.number().nullable()})),
  goalsCount:z.number(), selectedSessions:z.array(coachSessionSchema),
});
export type CoachContext = z.infer<typeof coachContextSchema>;

export const coachBootstrapSchema = z.object({
  homeThreadId: z.uuid(), topics: z.array(coachTopicSchema),
  threads: z.array(coachThreadSchema), memories: z.array(coachMemorySchema),
});
export const coachConversationSchema = z.object({
  thread: coachThreadSchema, messages: z.array(coachMessageSchema), before: z.number().nullable(),
  actions: z.array(coachActionSchema), runs: z.array(coachRunSchema),
});
export const coachStreamEventSchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("accepted"), data: z.object({ run: coachRunSchema }) }),
  z.object({ event: z.literal("stage"), data: z.object({ stage: z.enum(["context_ready", "generating"]) }) }),
  z.object({ event: z.literal("settled"), data: z.object({ runId: z.uuid() }) }),
  z.object({ event: z.literal("error"), data: z.object({ code: z.string(), message: z.string(), correlationId: z.string() }) }),
]);
export type CoachConversation = z.infer<typeof coachConversationSchema>;

export const coachActionCursorSchema = z.object({ createdAt: z.iso.datetime({ offset: true }), id: z.uuid() }).strict();
export const coachActionHistorySchema = z.object({ actions: z.array(coachActionSchema), next: coachActionCursorSchema.nullable() });
