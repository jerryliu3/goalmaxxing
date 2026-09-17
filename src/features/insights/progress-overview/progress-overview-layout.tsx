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
  progressViewTitle,
  type ProgressSectionId,
} from "@/features/insights/progress-overview/progress-view-model";
import { useProgressView } from "@/features/insights/progress-overview/use-progress-view";

const VIEW_TAB_LAYOUT_ID = "progress-view";
const VIEW_PANEL_ID = "progress-view-panel";

export interface ProgressOverviewSectionContent {
  id: ProgressSectionId;
  /** Overrides the canonical section label when a section needs live context. */
  title?: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  summary: ReactNode;
  detail?: ReactNode;
  detailLabel?: string;
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
  const [expandedIds, setExpandedIds] = useState<readonly ProgressSectionId[]>([]);
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
  const visibleSections = orderedSections.filter(
    (section) => section.definition.view === view
  );

  useEffect(() => {
    if (!pendingSectionId) {
      return;
    }
    setExpandedIds((current) =>
      current.includes(pendingSectionId) ? current : [...current, pendingSectionId]
    );
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
    activeSectionId && progressViewForSection(activeSectionId) === view
      ? activeSectionId
      : null;

  const toggleSection = (id: ProgressSectionId) => {
    setActiveSectionId(id);
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((expandedId) => expandedId !== id)
        : [...current, id]
    );
  };

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

      <SegmentedTabs
        className="md:hidden"
        items={PROGRESS_VIEWS.map((definition) => ({
          value: definition.value,
          label: definition.label,
          controlsId: VIEW_PANEL_ID,
        }))}
        value={view}
        onChange={selectView}
        label="Progress views"
        highlightLayoutId={VIEW_TAB_LAYOUT_ID}
      />

      <div className="md:grid md:grid-cols-[minmax(9rem,13rem)_minmax(0,1fr)] md:gap-8">
        <ProgressSectionIndex
          className="hidden md:block md:sticky md:top-6 md:self-start"
          availableSectionIds={availableSectionIds}
          activeSectionId={highlightedSectionId}
          onSelect={selectSection}
        />
        <div
          id={VIEW_PANEL_ID}
          role="tabpanel"
          aria-labelledby={`${VIEW_TAB_LAYOUT_ID}-${view}`}
          className="min-w-0"
        >
          <h2 className="border-b border-border pb-3 font-display text-lg font-semibold tracking-tight">
            {progressViewTitle(view)}
          </h2>
          <div className="pt-6">
            {visibleSections.map(({ definition, content }) => (
              <ProgressSection
                key={definition.id}
                id={definition.id}
                title={content.title ?? definition.label}
                subtitle={content.subtitle}
                meta={content.meta}
                summary={content.summary}
                detail={content.detail}
                detailLabel={content.detailLabel}
                expanded={expandedIds.includes(definition.id)}
                onToggle={() => toggleSection(definition.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
