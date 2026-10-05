"use client";

import { CircleHelp, Settings, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckboxDropdown } from "@/components/ui/checkbox-dropdown";
import { Label } from "@/components/ui/label";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import { Tooltip } from "@/components/ui/tooltip";
import type { GoalCategoryFilterOption } from "@/features/goals/goal-filters";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";
import { PlannerEndMonthQuickFilterChips } from "@/features/planner/planner-end-month-quick-filter-chips";
import type { PlannerEligibilityNotices } from "@/features/planner/planner-eligibility-notices";

// Goal View is the last segment; the calendar views lead.
const PLAN_VIEW_OPTIONS: ReadonlyArray<SegmentedControlOption<PlannerCalendarViewMode | "goals">> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "goals", label: "Goal View" },
];

interface PlannerCalendarToolbarProps {
  hasDraftSession: boolean;
  plannerReadOnly: boolean;
  canShowSaveAction: boolean;
  saveButtonLabel: string;
  draftSaveBlockedMessage: string | null;
  saveDisabled: boolean;
  undoDisabled: boolean;
  loading: boolean;
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  canOpenSettings: boolean;
  linkedTargetDetails: PlannerEligibilityNotices["linkedTargetDetails"];
  searchQuery: string;
  referenceMonth: string;
  endMonthFilters: string[];
  onEndMonthFiltersChange: (months: string[]) => void;
  onSave: () => void;
  onDiscardDraftChanges: () => void;
  onViewModeChange: (viewMode: PlannerCalendarViewMode) => void;
  goalIdFilters: string[];
  onGoalIdFiltersChange: (goalIds: string[]) => void;
  /** Empty hides the dropdown (for example while tasks replace goals). */
  goalFilterOptions: GoalCategoryFilterOption[];
  onGoalViewOpenChange: (open: boolean) => void;
  onOpenFilters: () => void;
  onOpenSettings: () => void;
  onSearchQueryChange: (query: string) => void;
}

function PlanViewModeSwitch({
  viewMode,
  goalViewOpen,
  loading,
  onViewModeChange,
  onGoalViewOpenChange,
}: {
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  loading: boolean;
  onViewModeChange: (viewMode: PlannerCalendarViewMode) => void;
  onGoalViewOpenChange: (open: boolean) => void;
}) {
  const resolvedViewMode = viewMode === "three_day" ? "week" : viewMode;
  return (
    <SegmentedControl
      label="Plan view mode"
      thumbTestId="plan-view-mode-thumb"
      options={PLAN_VIEW_OPTIONS}
      value={goalViewOpen ? "goals" : resolvedViewMode}
      disabled={loading}
      onChange={(value) => {
        if (value === "goals") {
          onGoalViewOpenChange(true);
          return;
        }
        onGoalViewOpenChange(false);
        onViewModeChange(value);
      }}
    />
  );
}

export function PlannerCalendarToolbar({
  hasDraftSession,
  plannerReadOnly,
  canShowSaveAction,
  saveButtonLabel,
  draftSaveBlockedMessage,
  saveDisabled,
  undoDisabled,
  loading,
  viewMode,
  goalViewOpen,
  canOpenSettings,
  linkedTargetDetails,
  searchQuery,
  referenceMonth,
  endMonthFilters,
  onEndMonthFiltersChange,
  onSave,
  onDiscardDraftChanges,
  onViewModeChange,
  goalIdFilters,
  onGoalIdFiltersChange,
  goalFilterOptions,
  onGoalViewOpenChange,
  onOpenFilters,
  onOpenSettings,
  onSearchQueryChange,
}: PlannerCalendarToolbarProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [showHiddenGoals, setShowHiddenGoals] = useState(false);
  const hiddenLinkedGoalCount = linkedTargetDetails.length;

  return (
    <div
      className="border-b border-border pb-4"
      data-testid="planner-calendar-toolbar"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight">Agenda</h2>
              <Tooltip content="Planner help" side="top" align="center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-round"
                  aria-label="Open planner help"
                  title="Planner help"
                  onClick={() => setHelpOpen(true)}
                >
                  <CircleHelp />
                </Button>
              </Tooltip>
              {hasDraftSession ? (
                <Badge
                  data-testid="planner-preview-mode-badge"
                  variant="secondary"
                  className="h-7 border-primary/40 px-3 text-sm font-semibold"
                >
                  Planning mode
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!plannerReadOnly && canShowSaveAction && hasDraftSession ? (
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                title={draftSaveBlockedMessage ?? undefined}
                disabled={saveDisabled}
              >
                {saveButtonLabel}
              </Button>
            ) : null}
            {plannerReadOnly ? (
              <span className="text-xs text-muted-foreground">
                Partner completions (view only)
              </span>
            ) : null}
            {hasDraftSession ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDiscardDraftChanges}
                disabled={undoDisabled}
              >
                Undo
              </Button>
            ) : null}
          </div>
        </div>
        <div data-onboarding="planner.calendar.controls" className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
          <PlanViewModeSwitch
            viewMode={viewMode}
            goalViewOpen={goalViewOpen}
            loading={loading}
            onViewModeChange={onViewModeChange}
            onGoalViewOpenChange={onGoalViewOpenChange}
          />
          {viewMode !== "day" || goalViewOpen ? <>
            <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
            <PlannerEndMonthQuickFilterChips
              referenceMonth={referenceMonth}
              endMonthFilters={endMonthFilters}
              onEndMonthFiltersChange={onEndMonthFiltersChange}
            />
          </> : null}
        </div>
        <div className="flex w-full items-center gap-2">
          <SearchField
            id="planner-calendar-search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Filter by goal or milestone name"
            aria-label="Search goals"
            disabled={loading}
          />
          {goalFilterOptions.length > 0 ? (
            <div className="w-28 shrink-0 sm:w-36">
              <Label htmlFor="planner-goal-filter" className="sr-only">
                Filter by goal
              </Label>
              <CheckboxDropdown
                id="planner-goal-filter"
                options={goalFilterOptions}
                selectedValues={goalIdFilters}
                onSelectedValuesChange={onGoalIdFiltersChange}
                placeholder="All goals"
                allLabel="All goals"
                triggerClassName="h-9 rounded-full border-border bg-background px-3.5 text-[13px] hover:border-foreground/40 hover:bg-background"
              />
            </div>
          ) : null}
          <div
            className="flex shrink-0 items-center gap-2"
            data-onboarding="planner.calendar.controls"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-round"
              aria-label="Filters"
              title="Filters"
              onClick={onOpenFilters}
              disabled={loading}
            >
              <SlidersHorizontal />
            </Button>
            {canOpenSettings ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-round"
                aria-label="Settings"
                title="Settings"
                onClick={onOpenSettings}
                disabled={loading}
              >
                <Settings />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <Dialog
        open={helpOpen}
        onOpenChange={(open) => {
          setHelpOpen(open);
          if (!open) {
            setShowHiddenGoals(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planner help</DialogTitle>
            <DialogDescription>
              Use this plan to preview scheduling changes before saving them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              <li>Switch between day, week, and month views.</li>
              <li>Drag sessions or use the detail editor to move dates and time overrides.</li>
              <li>
                Regenerate from planner settings when needed, then save once the preview looks
                right.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Linked main goals are hidden for clarity while linked source goals remain active.
            </p>
            {hiddenLinkedGoalCount > 0 ? (
              <div className="space-y-2 rounded-md border border-warning bg-warning-fill px-3 py-2 text-xs text-foreground">
                <p>
                  {hiddenLinkedGoalCount} linked main goal
                  {hiddenLinkedGoalCount === 1 ? " is" : "s are"} currently hidden in this
                  preview window.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowHiddenGoals((current) => !current)}
                >
                  {showHiddenGoals ? "Hide hidden goals" : "See hidden goals"}
                </Button>
                {showHiddenGoals ? (
                  <div
                    className={`space-y-1 rounded-md border border-warning/30 bg-background/70 p-2 text-xs text-foreground ${
                      hiddenLinkedGoalCount > 5 ? "max-h-36 overflow-y-auto pr-1" : ""
                    }`}
                  >
                    {linkedTargetDetails.map((detail) => (
                      <p key={`linked-target-help-${detail.goalId}`}>
                        {detail.goalTitle}: {detail.statusCopy}
                        {detail.sourceGoalTitles.length > 0
                          ? ` Linked source goals: ${detail.sourceGoalTitles.join(", ")}.`
                          : ""}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => setHelpOpen(false)}>
              Back to plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
