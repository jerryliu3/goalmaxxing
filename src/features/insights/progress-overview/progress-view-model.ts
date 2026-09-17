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
  /** Tab label. */
  label: string;
  /** Heading above the section stack. */
  title: string;
}

export const PROGRESS_VIEWS: readonly ProgressViewDefinition[] = [
  { value: "current", label: "Current", title: "Current progress" },
  { value: "past", label: "Past", title: "Past progress" },
];

export const PROGRESS_SECTIONS: readonly ProgressSectionDefinition[] = [
  { id: "score", label: "Goalmaxxing score", view: "current" },
  { id: "week", label: "This week", view: "current" },
  { id: "history", label: "Completion history", view: "current" },
  { id: "achievements", label: "Achievements", view: "past" },
  { id: "past-goals", label: "Past goals", view: "past" },
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

export function progressViewTitle(view: ProgressView): string {
  return (
    PROGRESS_VIEWS.find((definition) => definition.value === view)?.title ??
    "Progress"
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
