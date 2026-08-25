import type { GoalDefinitionValidationIssue } from "@/lib/goals/definition-validation";

export function resolveGoalDefinitionValidationFeedback(
  issues: GoalDefinitionValidationIssue[]
): { validationError: string | null; validationWarning: string | null } {
  const blockingIssue = issues.find(
    (issue) => issue.code !== "target_exceeds_capacity"
  );
  if (blockingIssue) {
    return { validationError: blockingIssue.message, validationWarning: null };
  }

  const warningIssue = issues.find(
    (issue) => issue.code === "target_exceeds_capacity"
  );
  return {
    validationError: null,
    validationWarning: warningIssue?.message ?? null,
  };
}
