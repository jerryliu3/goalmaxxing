"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SegmentedTabs } from "@/components/navigation/segmented-tabs";
import { ProgressSectionIndex } from "@/features/insights/progress-overview/progress-section-index";
import {
  PROGRESS_VIEWS,
  progressSectionElementId,
  progressViewForSection,
  type ProgressSectionId,
  type ProgressView,
} from "@/features/insights/progress-overview/progress-view-model";
import { useProgressView } from "@/features/insights/progress-overview/use-progress-view";

const VIEW_TAB_LAYOUT_ID = "progress-view";
const VIEW_PANEL_ID = "progress-view-panel";

/**
 * Progress page frame: title, mobile view tabs and the wide-screen side index.
 * The body is rendered by the caller — one section stack on the personal page,
 * one per lane in duo — so every scope shares this chrome.
 */
export function ProgressOverviewLayout({
  availableSectionIds,
  children,
}: {
  availableSectionIds: readonly ProgressSectionId[];
  children: (view: ProgressView) => ReactNode;
}) {
  const { view, pendingSectionId, selectView, selectSection, clearPendingSection } =
    useProgressView();
  const [activeSectionId, setActiveSectionId] = useState<ProgressSectionId | null>(
    null
  );

  const availableViews = PROGRESS_VIEWS.filter((definition) =>
    availableSectionIds.some(
      (id) => progressViewForSection(id) === definition.value
    )
  );
  const activeView = availableViews.some((definition) => definition.value === view)
    ? view
    : (availableViews[0]?.value ?? "current");
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
          className="min-w-0 space-y-4"
        >
          {children(activeView)}
        </div>
      </div>
    </div>
  );
}
