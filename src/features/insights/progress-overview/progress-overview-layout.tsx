"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SegmentedTabs } from "@/components/navigation/segmented-tabs";
import { ProgressSection } from "@/features/insights/progress-overview/progress-section";
import { ProgressSectionIndex } from "@/features/insights/progress-overview/progress-section-index";
import {
  PROGRESS_SECTIONS,
  PROGRESS_VIEWS,
  progressSectionElementId,
  progressViewForSection,
  type ProgressSectionId,
} from "@/features/insights/progress-overview/progress-view-model";
import { useProgressView } from "@/features/insights/progress-overview/use-progress-view";

const VIEW_TAB_LAYOUT_ID = "progress-view";
const VIEW_PANEL_ID = "progress-view-panel";

export interface ProgressOverviewSectionContent {
  id: ProgressSectionId;
  /** Overrides the canonical section label when a section needs live context. */
  title?: string;
  /** Set when the content renders the section heading itself. */
  hideTitle?: boolean;
  content: ReactNode;
}

/**
 * Progress page frame: one section stack per view, with mobile tabs and a
 * wide-screen side index selecting between them.
 */
export function ProgressOverviewLayout({
  sections,
}: {
  sections: readonly ProgressOverviewSectionContent[];
}) {
  const { view, pendingSectionId, selectView, selectSection, clearPendingSection } =
    useProgressView();
  const [activeSectionId, setActiveSectionId] = useState<ProgressSectionId | null>(
    null
  );

  const orderedSections = useMemo(
    () =>
      PROGRESS_SECTIONS.flatMap((definition) => {
        const content = sections.find((section) => section.id === definition.id);
        return content ? [{ definition, content }] : [];
      }),
    [sections]
  );
  const availableSectionIds = useMemo(
    () => orderedSections.map((section) => section.definition.id),
    [orderedSections]
  );
  const availableViews = PROGRESS_VIEWS.filter((definition) =>
    orderedSections.some((section) => section.definition.view === definition.value)
  );
  const activeView = availableViews.some((definition) => definition.value === view)
    ? view
    : (availableViews[0]?.value ?? "current");
  const visibleSections = orderedSections.filter(
    (section) => section.definition.view === activeView
  );
  const showViewTabs = availableViews.length > 1;

  useEffect(() => {
    if (!pendingSectionId) {
      return;
    }
    setActiveSectionId(pendingSectionId);
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(progressSectionElementId(pendingSectionId))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      clearPendingSection();
    });
    return () => cancelAnimationFrame(frame);
  }, [clearPendingSection, pendingSectionId]);

  const highlightedSectionId =
    activeSectionId && progressViewForSection(activeSectionId) === activeView
      ? activeSectionId
      : null;

  return (
    <div className="space-y-4" data-testid="progress-overview">
      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Your effort, over time
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Progress
        </h1>
      </div>

      {showViewTabs ? (
        <div className="md:hidden" data-onboarding="insights.views">
          <SegmentedTabs
            items={availableViews.map((definition) => ({
              value: definition.value,
              label: definition.label,
              controlsId: VIEW_PANEL_ID,
            }))}
            value={activeView}
            onChange={selectView}
            label="Progress views"
            highlightLayoutId={VIEW_TAB_LAYOUT_ID}
          />
        </div>
      ) : null}

      <div className="md:grid md:grid-cols-[minmax(9rem,13rem)_minmax(0,1fr)] md:gap-8">
        <ProgressSectionIndex
          className="hidden md:sticky md:top-6 md:block md:self-start"
          availableSectionIds={availableSectionIds}
          activeSectionId={highlightedSectionId}
          onSelect={selectSection}
        />
        <div
          id={VIEW_PANEL_ID}
          role={showViewTabs ? "tabpanel" : undefined}
          aria-labelledby={
            showViewTabs ? `${VIEW_TAB_LAYOUT_ID}-${activeView}` : undefined
          }
          className="min-w-0"
        >
          {visibleSections.map(({ definition, content }) => (
            <ProgressSection
              key={definition.id}
              id={definition.id}
              title={content.title ?? definition.label}
              hideTitle={content.hideTitle}
            >
              {content.content}
            </ProgressSection>
          ))}
        </div>
      </div>
    </div>
  );
}
