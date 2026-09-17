export type ProgressView = "current" | "past";

export type ProgressSectionId =
  | "score"
  | "week"
  | "history"
  | "achievements"
  | "past-goals";

export interface ProgressSectionDefinition {
  id: ProgressSectionId;
  /** Label used by the side index and the section heading. */
  label: string;
  view: ProgressView;
}

export interface ProgressViewDefinition {
  value: ProgressView;
  /** Tab and side-index label. */
  label: string;
}

export const PROGRESS_VIEWS: readonly ProgressViewDefinition[] = [
  { value: "current", label: "Current" },
  { value: "past", label: "Past" },
];

export const PROGRESS_SECTIONS: readonly ProgressSectionDefinition[] = [
  { id: "score", label: "Goalmaxxing score", view: "current" },
  { id: "history", label: "Completion history", view: "current" },
  { id: "week", label: "This week", view: "current" },
  { id: "past-goals", label: "Past goals", view: "past" },
  { id: "achievements", label: "Achievements", view: "past" },
];

const LEGACY_ACHIEVEMENTS_HASH = "progress-achievements";

export function parseProgressView(value: string | null | undefined): ProgressView {
  return value === "past" ? "past" : "current";
}

export function progressSectionsForView(
  view: ProgressView
): ProgressSectionDefinition[] {
  return PROGRESS_SECTIONS.filter((section) => section.view === view);
}

export function progressSectionElementId(id: ProgressSectionId): string {
  return `progress-section-${id}`;
}

export function progressViewForSection(id: ProgressSectionId): ProgressView {
  return (
    PROGRESS_SECTIONS.find((section) => section.id === id)?.view ?? "current"
  );
}

/**
 * Resolve a `#progress-...` hash into the view and section it targets. Keeps
 * the pre-existing `#progress-achievements` links working now that
 * achievements live under the Past view.
 */
export function resolveProgressDeepLink(
  hash: string | null | undefined
): { view: ProgressView; sectionId: ProgressSectionId } | null {
  const target = (hash ?? "").replace(/^#/, "");
  if (target.length === 0) {
    return null;
  }
  const sectionId =
    target === LEGACY_ACHIEVEMENTS_HASH
      ? "achievements"
      : PROGRESS_SECTIONS.find(
          (section) => progressSectionElementId(section.id) === target
        )?.id;
  if (!sectionId) {
    return null;
  }
  return { view: progressViewForSection(sectionId), sectionId };
}
