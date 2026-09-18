"use client";

import { useMemo, type ReactNode } from "react";
import { ProgressSection } from "@/features/insights/progress-overview/progress-section";
import {
  PROGRESS_SECTIONS,
  progressSectionElementId,
  type ProgressSectionId,
  type ProgressView,
} from "@/features/insights/progress-overview/progress-view-model";

export interface ProgressOverviewSectionContent {
  id: ProgressSectionId;
  /** Overrides the canonical section label when a section needs live context. */
  title?: string;
  /** Set when the content renders the section heading itself. */
  hideTitle?: boolean;
  content: ReactNode;
}

/**
 * One column of Progress sections for the active view. Duo renders one stack
 * per lane, so only the anchor lane owns the element ids the side index and
 * the onboarding tour point at.
 */
export function ProgressSectionStack({
  sections,
  view,
  anchored = true,
}: {
  sections: readonly ProgressOverviewSectionContent[];
  view: ProgressView;
  /** False for secondary duo lanes, which must not duplicate element ids. */
  anchored?: boolean;
}) {
  const visibleSections = useMemo(
    () =>
      PROGRESS_SECTIONS.flatMap((definition) => {
        if (definition.view !== view) {
          return [];
        }
        const content = sections.find((section) => section.id === definition.id);
        return content ? [{ definition, content }] : [];
      }),
    [sections, view]
  );

  return (
    <div className="min-w-0">
      {visibleSections.map(({ definition, content }) => (
        <ProgressSection
          key={definition.id}
          id={definition.id}
          elementId={anchored ? progressSectionElementId(definition.id) : undefined}
          title={content.title ?? definition.label}
          hideTitle={content.hideTitle}
        >
          {content.content}
        </ProgressSection>
      ))}
    </div>
  );
}
