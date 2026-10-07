export type ProgressSectionId = "week" | "history";

export interface ProgressSectionDefinition {
  id: ProgressSectionId;
  label: string;
}

export const PROGRESS_SECTIONS: readonly ProgressSectionDefinition[] = [
  { id: "history", label: "Progress tracker" },
  { id: "week", label: "This week" },
];

export function progressSectionElementId(id: ProgressSectionId): string {
  return `progress-section-${id}`;
}
