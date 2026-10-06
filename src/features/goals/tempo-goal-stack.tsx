"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { BulkGoalDraftReviewProps } from "./bulk-goal-draft-review";
import {
  applyBulkGoalCreationChange,
  withValidatedBulkGoalDraft,
} from "@/lib/goals/bulk-drafts";
import type { GoalCreationFieldChange } from "@/lib/goals/creation-model";
import { getGoalCreationPeriodLimitError } from "@/lib/goals/creation-model";
import { TempoGoalCard } from "./tempo-goal-card";
import { TempoGoalFields } from "./tempo-goal-fields";
import type { TempoCardVisibility } from "./tempo-creation-progress";

export function TempoGoalStack({
  drafts,
  setDrafts,
  onCreate,
  availableGoals = [],
  saving,
  editingDisabled,
  createDisabledMessage,
  emptyMessage,
}: Omit<BulkGoalDraftReviewProps, "variant">) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const activeIndex = Math.max(
    0,
    drafts.findIndex((draft) => draft.id === activeId),
  );
  const draft = drafts[activeIndex];
  const selected = drafts.filter((item) => item.include);
  const invalid = selected.filter(
    (item) => item.errors.length > 0 || getGoalCreationPeriodLimitError(item),
  );
  const locked = Boolean(saving || editingDisabled);
  const navigate = (offset: number) => {
    const next = drafts[activeIndex + offset];
    if (next) setActiveId(next.id);
  };
  if (!draft)
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  const update = (change: GoalCreationFieldChange) => {
    if (locked) return;
    setDrafts((previous) =>
      previous.map((item) =>
        item.id === draft.id
          ? withValidatedBulkGoalDraft(
              applyBulkGoalCreationChange(item, change),
            )
          : item,
      ),
    );
  };
  const linkedGoal =
    availableGoals.find((goal) => goal.id === draft.linked_target_goal_id) ??
    null;
  const preview = (visibility: TempoCardVisibility) => (
    <>
      <div className="tempo-stack">
        <motion.div
          key={draft.id}
          className="tempo-stack-front"
          drag={drafts.length > 1 && !locked && !reducedMotion ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 55)
              navigate(info.offset.x < 0 ? 1 : -1);
          }}
          initial={reducedMotion ? false : { opacity: 0.5, rotateY: -8, x: 20 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          transition={{ type: "spring", stiffness: 230, damping: 25 }}
        >
          <TempoGoalCard
            fields={draft}
            visibility={visibility}
            assembly={
              visibility.review && visibility.plaqueTarget
                ? { completed: 0, target: visibility.plaqueTarget, preview: true }
                : undefined
            }
          />
        </motion.div>
      </div>
      <div className="tempo-stack-nav">
        <button
          type="button"
          aria-label="Previous goal"
          disabled={activeIndex === 0 || saving}
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <span aria-live="polite">
          Goal {activeIndex + 1} of {drafts.length}
        </span>
        <button
          type="button"
          aria-label="Next goal"
          disabled={activeIndex === drafts.length - 1 || saving}
          onClick={() => navigate(1)}
        >
          →
        </button>
      </div>
      <label className="tempo-stack-select">
        <input
          type="checkbox"
          checked={draft.include}
          disabled={locked}
          onChange={(e) =>
            setDrafts((previous) =>
              previous.map((item) =>
                item.id === draft.id
                  ? { ...item, include: e.target.checked }
                  : item,
              ),
            )
          }
        />
        Include this goal · {selected.length} selected
      </label>
      {!visibility.review && (
        <p className="tempo-hint">
          Swipe through your cards, or use the arrows. Each card keeps its own
          settings.
        </p>
      )}
      {invalid.length > 0 && (
        <div className="tempo-stack-jump" aria-label="Goals needing attention">
          {invalid.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={item.id === draft.id}
              onClick={() => setActiveId(item.id)}
            >
              Fix {item.title || "untitled goal"}
            </button>
          ))}
        </div>
      )}
    </>
  );
  return (
    <TempoGoalFields
      key={draft.id}
      fields={draft}
      prefilled
      onFieldChange={update}
      onPatch={(value) => update({ type: "patch", value })}
      createKind={draft.frequency_type}
      onCreateKindChange={(value) => {
        if (value !== "planner_task") update({ type: "frequency_type", value });
      }}
      isPlannerTask={false}
      disabled={locked}
      preview={preview}
      error={draft.errors.join(" ") || createDisabledMessage}
      linkTarget={{
        value: draft.linked_target_goal_id,
        onValueChange: (linked_target_goal_id) =>
          update({ type: "patch", value: { linked_target_goal_id } }),
        open: draft.link_target_open,
        onOpenChange: (open) => {
          if (!locked)
            setDrafts((previous) =>
              previous.map((item) =>
                item.id === draft.id
                  ? {
                      ...item,
                      link_target_open: open,
                      link_target_search: open ? item.link_target_search : "",
                    }
                  : item,
              ),
            );
        },
        searchQuery: draft.link_target_search,
        onSearchQueryChange: (value) => {
          if (!locked)
            setDrafts((previous) =>
              previous.map((item) =>
                item.id === draft.id
                  ? { ...item, link_target_search: value }
                  : item,
              ),
            );
        },
        filteredLinkTargets: availableGoals.filter((goal) =>
          goal.title
            .toLowerCase()
            .includes(draft.link_target_search.toLowerCase()),
        ),
        selectedTargetGoal: linkedGoal,
      }}
      action={
        <Button
          type="button"
          disabled={
            locked ||
            selected.length === 0 ||
            invalid.length > 0 ||
            Boolean(createDisabledMessage)
          }
          onClick={() => void onCreate()}
        >
          {saving
            ? "Creating…"
            : `Create ${selected.length} selected ${selected.length === 1 ? "goal" : "goals"}`}
        </Button>
      }
    />
  );
}
