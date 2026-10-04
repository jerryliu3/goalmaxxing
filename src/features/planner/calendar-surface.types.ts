import type { PlannerDraftVisualKind } from "@/lib/planner/diff";
import type {
  PlannerCalendarViewMode,
  PlannerShellTab,
} from "@cadence/shared/planner/calendar-state";
import type {
  PlannerActiveGoalSnapshot,
  PlannerActiveItemSnapshot,
  PlannerCompletionFactMarker,
} from "@cadence/shared/planner/context";
import type { DuoLaneSubject } from "@cadence/shared/social/duo";

export type CalendarTab = PlannerShellTab;
export type { PlannerCalendarViewMode };
export type {
  DraftItemEdit,
  PlannerActiveGoalSnapshot,
  PlannerActiveItemSnapshot,
  PlannerCompletionFactMarker,
  PlannerContextPayload,
  PlannerErrorPayload,
  PlannerGoalHorizonSummary,
  PlannerPreferencesPayload,
  PlannerPreviewResponsePayload,
  PlannerVisibleMonthContextPayload,
  PlannerWorkUnit,
} from "@cadence/shared/planner/context";

export type PlannerCalendarEntryKind = "goal" | "task";

export interface PlannerDayDetailEntry {
  key: string;
  entryKind?: PlannerCalendarEntryKind;
  originalGoalId: string;
  goalTitle: string | null;
  unitKey: string;
  label: string | null;
  classification: string;
  creditState: string;
  activeGoal: PlannerActiveGoalSnapshot | null;
  activeItem: PlannerActiveItemSnapshot | null;
  draftDiffKind: PlannerDraftVisualKind | null;
  draftDiffFromDate: string | null;
  draftDiffToDate: string | null;
  draftGhost: boolean;
  hasLinkedTargets?: boolean;
  goalDefaultLocalTime?: string | null;
  scheduledTimeOverride?: string | null;
  effectiveScheduledLocalTime?: string | null;
}

export interface DayPreviewState {
  day: string;
  pinned: boolean;
  position: {
    top: number;
    left: number;
    width: number;
    placement: "above" | "below";
  };
}

export type SelectedDayChangeOptions = {
  alignMonth?: boolean;
};

export interface CalendarSurfaceProps {
  activeTab: CalendarTab;
  month: string | null;
  selectedDay: string | null;
  viewMode: PlannerCalendarViewMode;
  onMonthChange: (month: string, mode: "push" | "replace") => void;
  onViewModeChange: (
    viewMode: PlannerCalendarViewMode,
    mode: "push" | "replace"
  ) => void;
  onSelectedDayChange: (
    day: string | null,
    mode: "push" | "replace",
    nextViewMode?: PlannerCalendarViewMode,
    options?: SelectedDayChangeOptions
  ) => void;
  onPlannerMutation: () => void;
  duoScope?: "me" | "partner" | "both";
  partnerCompletionMarkersByDate?: Map<string, PlannerCompletionFactMarker[]>;
  partnerOverlayError?: string | null;
  partnerLabel?: string | null;
  viewerSubject?: DuoLaneSubject | null;
  partnerSubject?: DuoLaneSubject | null;
}

export type CompletionControlDisabledReason =
  | "future_creation"
  | "satisfied_elsewhere"
  | "out_of_scope_route"
  | "unsupported";
