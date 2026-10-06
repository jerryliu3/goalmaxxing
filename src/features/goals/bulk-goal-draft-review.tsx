"use client";

import { LoaderCircle, Sparkles, Trash2 } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type BulkGoalDraft,
  applyBulkGoalCreationChange,
  bulkGoalDraftRequiresEndDate,
  summarizeBulkGoalDraftSchedule,
  withValidatedBulkGoalDraft,
} from "@/lib/goals/bulk-drafts";
import { GoalCreationFieldControls } from "@/features/goals/goal-creation-fields";
import {
  type GoalCreationFieldChange,
} from "@/lib/goals/creation-model";
import type { GoalCreateKind } from "@/lib/goals/form-options";
import {
  getLinkedGoalDeadlineLabel,
  getLinkedGoalRecurrenceLabel,
} from "@/lib/goals/linked-goal-labels";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

export interface BulkGoalDraftReviewProps {
  variant: "full" | "coach";
  drafts: BulkGoalDraft[];
  setDrafts: Dispatch<SetStateAction<BulkGoalDraft[]>>;
  saving: boolean;
  onCreate: () => void | Promise<void>;
  availableGoals?: Goal[];
  warnings?: string[];
  emptyMessage?: string;
  createLabel?: string;
  createDisabledMessage?: string | null;
  editingDisabled?: boolean;
}

function applyCreateKindChange(
  draft: Omit<BulkGoalDraft, "errors">,
  kind: GoalCreateKind
): Omit<BulkGoalDraft, "errors"> {
  if (kind === "planner_task") {
    return draft;
  }
  return applyBulkGoalCreationChange(draft, {
    type: "frequency_type",
    value: kind,
  });
}

export function BulkGoalDraftReview(props: BulkGoalDraftReviewProps) {
  const {
    drafts,
    setDrafts,
    saving,
    onCreate,
    availableGoals = [],
    warnings = [],
    emptyMessage = "Generate drafts to review and edit them.",
    createLabel = "Create selected goals",
    createDisabledMessage = null,
    editingDisabled = false,
  } = props;
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const selectedDrafts = useMemo(
    () => drafts.filter((draft) => draft.include),
    [drafts]
  );
  const selectedInvalidCount = useMemo(
    () => selectedDrafts.filter((draft) => draft.errors.length > 0).length,
    [selectedDrafts]
  );

  const updateDraft = (
    draftId: string,
    updater: (
      draft: Omit<BulkGoalDraft, "errors">
    ) => Omit<BulkGoalDraft, "errors">
  ) => {
    if (editingDisabled) {
      return;
    }
    setDrafts((previous) =>
      previous.map((draft) =>
        draft.id === draftId
          ? withValidatedBulkGoalDraft(updater(draft))
          : draft
      )
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Preview drafts</CardTitle>
            <CardDescription>
              Review and edit parsed goals before creating them.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{selectedDrafts.length} selected</Badge>
            <Badge variant="outline">
              {selectedInvalidCount} selected with errors
            </Badge>
            <Button
              type="button"
              onClick={() => void onCreate()}
              disabled={
                saving ||
                selectedDrafts.length === 0 ||
                selectedInvalidCount > 0 ||
                Boolean(createDisabledMessage)
              }
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {createLabel}
            </Button>
          </div>
        </div>
        {createDisabledMessage ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {createDisabledMessage}
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          drafts.map((draft) => {
            const linkQuery = draft.link_target_search.trim().toLowerCase();
            const filteredLinkTargets = availableGoals.filter((goal) => {
              if (!linkQuery) return true;
              return (
                goal.title.toLowerCase().includes(linkQuery) ||
                getLinkedGoalRecurrenceLabel(goal)
                  .toLowerCase()
                  .includes(linkQuery) ||
                getLinkedGoalDeadlineLabel(goal)
                  .toLowerCase()
                  .includes(linkQuery)
              );
            });
            const selectedTargetGoal =
              draft.linked_target_goal_id === "none"
                ? null
                : availableGoals.find(
                    (goal) => goal.id === draft.linked_target_goal_id
                  ) ?? null;
            const expanded = expandedDraftId === draft.id;
            const toggleDraftEditor = () => {
              if (editingDisabled) {
                return;
              }
              setExpandedDraftId((previous) =>
                previous === draft.id ? null : draft.id
              );
            };

            return (
              <div key={draft.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="inline-flex shrink-0 items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={draft.include}
                      disabled={editingDisabled}
                      onChange={(event) =>
                        updateDraft(draft.id, (previous) => ({
                          ...previous,
                          include: event.target.checked,
                        }))
                      }
                    />
                    {draft.sourceRowLabel}
                  </label>
                  <div
                    className={cn(
                      "min-w-0 flex-1 cursor-pointer rounded-lg border bg-muted/10 px-3 py-2 transition-colors hover:bg-muted/20",
                      draft.include &&
                        draft.errors.length > 0 &&
                        "border-destructive/50"
                    )}
                    role="button"
                    aria-disabled={editingDisabled}
                    tabIndex={editingDisabled ? -1 : 0}
                    onClick={toggleDraftEditor}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleDraftEditor();
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">
                          {draft.title.trim() || "Untitled goal"}
                        </span>
                        <Badge variant="outline">
                          {draft.category_selection}
                        </Badge>
                        <Badge variant="outline">
                          {summarizeBulkGoalDraftSchedule(draft)}
                        </Badge>
                        {draft.errors.length > 0 ? (
                          <Badge variant="destructive">
                            {draft.errors.length} error
                            {draft.errors.length === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="px-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleDraftEditor();
                          }}
                          disabled={editingDisabled}
                        >
                          {expanded ? "close" : "tap to edit"}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (editingDisabled) {
                              return;
                            }
                            setDrafts((previous) =>
                              previous.filter(
                                (entry) => entry.id !== draft.id
                              )
                            );
                            setExpandedDraftId((previous) =>
                              previous === draft.id ? null : previous
                            );
                          }}
                          aria-label={`Remove ${draft.title || "draft"}`}
                          disabled={editingDisabled}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {draft.errors.length > 0 ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2">
                    <ul className="space-y-1 text-xs text-destructive">
                      {draft.errors.map((error) => (
                        <li key={`${draft.id}-${error}`}>- {error}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {expanded ? (
                  <Dialog
                    open
                    onOpenChange={(open) => {
                      if (!open) setExpandedDraftId(null);
                    }}
                  >
                    <DialogContent
                      overlayClassName="z-[115] bg-black/15"
                      className="z-[120] max-h-[88vh] overflow-y-auto sm:!max-w-none"
                      style={{
                        width: "min(calc(100vw - 1.5rem), 62rem)",
                        maxWidth: "min(calc(100vw - 1.5rem), 62rem)",
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>
                          {draft.title.trim() || "Edit goal draft"}
                        </DialogTitle>
                        <DialogDescription>
                          Update this draft before creating goals.
                        </DialogDescription>
                      </DialogHeader>

                      <GoalCreationFieldControls
                        fields={draft}
                        onFieldChange={(change) =>
                          updateDraft(draft.id, (previous) =>
                            applyBulkGoalCreationChange(previous, change)
                          )
                        }
                        onPatch={(patch) =>
                          updateDraft(draft.id, (previous) => ({
                            ...previous,
                            ...patch,
                          }))
                        }
                        disabled={editingDisabled}
                        createKind={draft.frequency_type}
                        onCreateKindChange={(kind) =>
                          updateDraft(draft.id, (previous) =>
                            applyCreateKindChange(previous, kind)
                          )
                        }
                        isPlannerTask={false}
                        linkTarget={{
                          value: draft.linked_target_goal_id,
                          onValueChange: (value) =>
                            updateDraft(draft.id, (previous) => ({
                              ...previous,
                              linked_target_goal_id: value,
                            })),
                          open: draft.link_target_open,
                          onOpenChange: (open) =>
                            updateDraft(draft.id, (previous) => ({
                              ...previous,
                              link_target_open: open,
                              link_target_search: open
                                ? previous.link_target_search
                                : "",
                            })),
                          searchQuery: draft.link_target_search,
                          onSearchQueryChange: (value) =>
                            updateDraft(draft.id, (previous) => ({
                              ...previous,
                              link_target_search: value,
                            })),
                          filteredLinkTargets,
                          selectedTargetGoal,
                        }}
                        showSoftHorizonHint={bulkGoalDraftRequiresEndDate(draft)}
                        startDateId={`${draft.id}-start-date`}
                        endDateId={`${draft.id}-end-date`}
                      />
                    </DialogContent>
                  </Dialog>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
