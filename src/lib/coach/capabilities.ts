import { z } from "zod";
const title = z.string().trim().min(1).max(160);
export const coachGoalDraftSchema = z.object({
  title: z.string().trim().min(1).max(120), description: z.string().max(2000).optional(),
  frequency_type: z.enum(["recurring", "fixed_milestones"]),
  recurrence_interval: z.enum(["daily", "weekly", "monthly"]).nullable(),
  target_basis: z.enum(["period", "lifetime"]), target_count: z.number().int().positive().max(1000),
  start_date: z.iso.date(), end_date: z.iso.date().nullable(),
  milestone_names: z.array(z.string().max(120)).max(100).optional(),
}).strict();
export const coachProposalSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("move_sessions"), title, moves: z.array(z.object({ itemId: z.uuid(), date: z.iso.date() }).strict()).min(1).max(8).refine(moves => new Set(moves.map(move => move.itemId)).size === moves.length, "Each session may appear only once.") }).strict(),
  z.object({ kind: z.literal("completion"), title, goalId: z.uuid(), date: z.iso.date(), completed: z.boolean() }).strict(),
  z.object({ kind: z.literal("task_move"), title, taskId: z.uuid(), date: z.iso.date() }).strict(),
  z.object({ kind: z.literal("task_completion"), title, taskId: z.uuid(), completed: z.boolean() }).strict(),
  z.object({ kind: z.literal("create_goal"), title, goal: coachGoalDraftSchema, linkedTargetGoalId: z.uuid().optional() }).strict(),
  z.object({ kind: z.literal("preference"), title, restWeekdays: z.array(z.number().int().min(0).max(6)).max(7) }).strict(),
]);
export type CoachProposal = z.infer<typeof coachProposalSchema>;
export const coachAnswerSchema = z.object({ reply: z.string().trim().min(1).max(12000), proposals: z.array(z.unknown()).max(6).default([]), summary: z.string().max(4000).default(""), memorySuggestion: z.string().trim().max(1000).transform(value => value || null).nullable().default(null) });
export const COACH_ACTION_INSTRUCTIONS = `You can propose these finite actions for the user to review. Never claim an action has succeeded: nothing changes until Apply.
Return proposals as an array of objects. Each object must match one of:
{"kind":"move_sessions","title":"...","moves":[{"itemId":"owned saved session UUID","date":"YYYY-MM-DD"}]}, maximum 8 moves, using only known saved sessions. Respect goal lifetime and cadence; dates must be today or future. This changes placements only.
{"kind":"completion","title":"...","goalId":"known goal UUID","date":"YYYY-MM-DD","completed":true or false}, today or past only. Canonical linked completion rules apply; recording may move an available session to that date.
{"kind":"task_move","title":"...","taskId":"known one-off task UUID","date":"YYYY-MM-DD"}.
{"kind":"task_completion","title":"...","taskId":"known one-off task UUID","completed":true or false}.
{"kind":"create_goal","title":"...","goal":{"title":"...","frequency_type":"recurring or fixed_milestones","recurrence_interval":"daily, weekly, monthly, or null","target_basis":"period or lifetime","target_count":integer,"start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD or null"},"linkedTargetGoalId":"optional known owned goal UUID"}. Ask questions if dates, cadence or target are not understood; never invent a user's commitment. Goals and the optional link are one reviewed action; scheduling is separate.
{"kind":"preference","title":"...","restWeekdays":[0-6, Sunday=0]}, only when the user explicitly asks to change default rest days. This does not replan existing placements.
If a planner draft is unsaved or timezone is unconfirmed, explain what the user needs to resolve before applying date-dependent changes. No destructive/social/external actions are available. Suggestions may be rejected by canonical validation; do not promise their feasibility.`;

// The provider owns JSON shape; the discriminated Zod contract owns capability validation.
export const coachProposalResponseSchema = {
  type: "OBJECT",
  properties: {
    kind: { type: "STRING", enum: ["move_sessions", "completion", "task_move", "task_completion", "create_goal", "preference"] },
    title: { type: "STRING" },
    moves: { type: "ARRAY", items: { type: "OBJECT", properties: { itemId: { type: "STRING" }, date: { type: "STRING" } }, required: ["itemId", "date"] } },
    goalId: { type: "STRING" }, taskId: { type: "STRING" }, date: { type: "STRING" }, completed: { type: "BOOLEAN" },
    restWeekdays: { type: "ARRAY", items: { type: "INTEGER" } }, linkedTargetGoalId: { type: "STRING" },
    goal: { type: "OBJECT", properties: {
      title: { type: "STRING" }, description: { type: "STRING" }, frequency_type: { type: "STRING", enum: ["recurring", "fixed_milestones"] },
      recurrence_interval: { type: "STRING", nullable: true, enum: ["daily", "weekly", "monthly"] },
      target_basis: { type: "STRING", enum: ["period", "lifetime"] }, target_count: { type: "INTEGER" },
      start_date: { type: "STRING" }, end_date: { type: "STRING", nullable: true }, milestone_names: { type: "ARRAY", items: { type: "STRING" } },
    }, required: ["title", "frequency_type", "recurrence_interval", "target_basis", "target_count", "start_date", "end_date"] },
  },
  required: ["kind", "title"],
};
