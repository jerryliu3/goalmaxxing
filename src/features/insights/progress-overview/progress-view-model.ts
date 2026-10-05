export type ProgressView = "current" | "past";

export type ProgressSectionId =
  | "week"
  | "history"
  | "achievements"
  | "past-goals";

export interface ProgressSectionDefinition {
  id: ProgressSectionId;
  /** Label used by the section heading. */
  label: string;
  view: ProgressView;
}

export const PROGRESS_SECTIONS: readonly ProgressSectionDefinition[] = [
  { id: "history", label: "Progress tracker", view: "current" },
  { id: "week", label: "This week", view: "current" },
  { id: "achievements", label: "Achievements", view: "past" },
  { id: "past-goals", label: "Goal library", view: "past" },
];

export function progressSectionElementId(id: ProgressSectionId): string {
  return `progress-section-${id}`;
}
