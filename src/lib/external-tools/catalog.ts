import type { OperationName } from "./schemas";

export const operationMetadata: Record<OperationName, { title: string; description: string; readOnly: boolean; destructive?: boolean }> = {
  get_account: { title: "Get account", description: "Read the connected account identity, preferences, timezone and current local date. Use this first to resolve relative dates.", readOnly: true },
  list_goals: { title: "List goals", description: "List your own non-deleted goals with cursor pagination. Continue using nextCursor until null before treating the list as complete.", readOnly: true },
  get_goal: { title: "Get goal", description: "Read one owned goal, including updated_at for subsequent edits.", readOnly: true },
  create_goal: { title: "Create goal", description: "Create a structured goal without invoking Goalmaxxing AI. Reuse requestId for unchanged retries. Its UUID is also the new goal ID. Confirm the definition with the user before writing.", readOnly: false },
  update_goal: { title: "Update goal", description: "Replace a goal's editable definition after user approval, using its exact expectedUpdatedAt. Preserve unchanged fields from get_goal. Frequency type, cadence, target basis, and start date are immutable. Use a stable requestId for retries.", readOnly: false, destructive: true },
  set_goal_archived: { title: "Archive or restore goal", description: "Archive or restore an owned goal after user approval. Supply its current updated_at and a stable requestId. This does not delete completion history.", readOnly: false },
  set_goal_link: { title: "Set goal link", description: "Set or clear the owned source goal's link to an owned target goal. Completing the source can credit the target through Goalmaxxing's canonical cascade. Confirm this behavior with the user first.", readOnly: false, destructive: true },
  get_progress: { title: "Get progress", description: "Read computed progress for your account. Optionally request a checklist date or a bounded completion-fact window. Results use the account timezone and canonical progress rules.", readOnly: true },
  get_plan: { title: "Get plan", description: "Read current planner context, saved sessions, preferences and digest for a calendar month. Does not prepare or publish a new schedule.", readOnly: true },
  preview_plan: { title: "Preview plan", description: "Compute a deterministic schedule preview without saving or invoking Goalmaxxing AI. Include draftCommands to propose session date/time edits. Show the changes to the user before publishing. Only stable, publishable previews return publishRequest; present the changes and required confirmations, then pass that exact object to publish_plan after approval.", readOnly: true },
  publish_plan: { title: "Publish plan", description: "Save the exact user-approved stable preview using its digest, previewHash, confirmationHash, policy and draftCommands. If stale, read and preview again and get renewed approval. Never invent hashes or auto-publish a changed preview.", readOnly: false, destructive: true },
  set_completion: { title: "Set completion", description: "Set a goal's completion date fact present or absent through the canonical completion path, preserving planner and linked-goal semantics. Set desired state rather than toggle. If targeting a saved session use plannerItemExpectation from the current plan.", readOnly: false, destructive: true },
  list_tasks: { title: "List tasks", description: "Read calendar tasks in a bounded date window.", readOnly: true },
  create_task: { title: "Create task", description: "Create a calendar task on a specified date and optional local time. Use the same requestId for unchanged retries to avoid duplicates.", readOnly: false },
  set_task_schedule: { title: "Schedule task", description: "Set an owned calendar task's scheduled date after user approval.", readOnly: false },
  set_task_completion: { title: "Set task completion", description: "Set a calendar task completed or incomplete. Sends the desired state, not a toggle.", readOnly: false },
};

export const httpRoutes = [
  { method: "GET", path: "/account", operation: "get_account" },
  { method: "GET", path: "/goals", operation: "list_goals" },
  { method: "POST", path: "/goals", operation: "create_goal" },
  { method: "GET", path: "/goals/{goalId}", operation: "get_goal" },
  { method: "PUT", path: "/goals/{goalId}", operation: "update_goal" },
  { method: "PUT", path: "/goals/{goalId}/archive", operation: "set_goal_archived" },
  { method: "PUT", path: "/goals/{goalId}/link", operation: "set_goal_link" },
  { method: "GET", path: "/progress", operation: "get_progress" },
  { method: "GET", path: "/planner", operation: "get_plan" },
  { method: "POST", path: "/planner/preview", operation: "preview_plan" },
  { method: "POST", path: "/planner/publish", operation: "publish_plan" },
  { method: "PUT", path: "/completions", operation: "set_completion" },
  { method: "GET", path: "/tasks", operation: "list_tasks" },
  { method: "POST", path: "/tasks", operation: "create_task" },
  { method: "PUT", path: "/tasks/{taskId}/schedule", operation: "set_task_schedule" },
  { method: "PUT", path: "/tasks/{taskId}/completion", operation: "set_task_completion" },
] as const satisfies ReadonlyArray<{ method: string; path: string; operation: OperationName }>;
