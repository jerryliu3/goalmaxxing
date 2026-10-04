import { z } from "zod";

const state = z.object({ date: z.iso.date().optional(), completed: z.boolean().optional(), restWeekdays: z.array(z.number().int().min(0).max(6)).optional() });
const common = { undoable: z.boolean(), undo: z.boolean().optional() };
const goal = z.object({
  title: z.string(), description: z.string().nullable(), frequency_type: z.enum(["recurring", "fixed_milestones"]),
  recurrence_interval: z.enum(["daily", "weekly", "monthly"]).nullable(), target_basis: z.enum(["period", "lifetime"]),
  target_count: z.number().int().positive(), start_date: z.iso.date(), end_date: z.iso.date().nullable(),
  milestone_names: z.array(z.string()).nullable(), difficulty: z.string(), is_private: z.boolean(),
});
export const coachActionPreviewSchema = z.union([
  z.object({ ...common, moves: z.array(z.object({ goal: z.string(), from: z.iso.date(), to: z.iso.date() })) }),
  z.object({ ...common, task: z.string(), before: state, after: state }),
  z.object({ ...common, goal: z.string(), date: z.iso.date(), completed: z.boolean(), movedFrom: z.iso.date().nullable(), linkedGoals: z.string() }),
  z.object({ ...common, goal, linkedTarget: z.string().nullable() }),
  z.object({ ...common, before: state, after: state, note: z.string() }),
]);

/** One human-readable review for web and native; never expose command internals. */
export function coachActionPreviewLines(value: unknown, kind: string): string[] {
  const preview = coachActionPreviewSchema.parse(value);
  const lines: string[] = [];
  if (preview.undo) lines.push("This reverses the reviewed change if its result is still current.");
  if ("moves" in preview) lines.push(...preview.moves.map(move => `${move.goal}: ${move.from} → ${move.to}`));
  if ("task" in preview) lines.push(kind === "task_move" ? `${preview.task}: ${preview.before.date} → ${preview.after.date}` : `${preview.task} · ${preview.after.completed ? "mark complete" : "remove completion"}`);
  if ("goal" in preview) {
    if ("date" in preview) {
      lines.push(`${preview.goal} · ${preview.date} · ${preview.completed ? "record completion" : "remove completion"}`, preview.linkedGoals);
      if (preview.movedFrom) lines.push(`Moves the session from ${preview.movedFrom} to the completion date.`);
    } else {
      const goal = preview.goal;
      const cadence = goal.target_basis === "lifetime" ? "total" : `per ${ { daily: "day", weekly: "week", monthly: "month" }[goal.recurrence_interval!] }`;
      lines.push(`${goal.title} · ${goal.target_count} ${goal.frequency_type === "fixed_milestones" ? "milestones" : cadence}`);
      lines.push(`${goal.start_date}${goal.end_date ? ` through ${goal.end_date}` : " onward"}`);
      if (goal.description) lines.push(goal.description);
      if (goal.milestone_names?.length) lines.push(`Milestones: ${goal.milestone_names.join(" · ")}`);
      lines.push(`${goal.is_private ? "Private" : "Visible on your shared profile"} · ${goal.difficulty} difficulty`);
      if (preview.linkedTarget) lines.push(`Linked to ${preview.linkedTarget}`);
    }
  }
  if ("note" in preview) {
    const weekday = (days?: number[]) => days?.map(day => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]).join(", ") || "None";
    lines.push(`Rest days: ${weekday(preview.before.restWeekdays)} → ${weekday(preview.after.restWeekdays)}`, preview.note);
  }
  return lines;
}
