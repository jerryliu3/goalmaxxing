"use client";

import type { ReactNode } from "react";
import type { ProgressSectionId } from "@/features/insights/progress-overview/progress-view-model";

export interface ProgressSectionProps {
  id: ProgressSectionId;
  /**
   * Anchor for the side index and the onboarding tour. Omitted on secondary
   * duo lanes so a section id stays unique in the document.
   */
  elementId?: string;
  title: string;
  /** Set when the content carries its own heading, e.g. inside a card. */
  hideTitle?: boolean;
  children: ReactNode;
}

export function ProgressSection({
  id,
  elementId,
  title,
  hideTitle = false,
  children,
}: ProgressSectionProps) {
  return (
    <section
      id={elementId}
      data-testid={elementId}
      data-onboarding={elementId ? `insights.${id}` : undefined}
      aria-label={title}
      className="scroll-mt-28 border-t border-border py-6 first:border-t-0 first:pt-0"
    >
      {hideTitle ? null : (
        <h3 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h3>
      )}
      <div className={hideTitle ? undefined : "mt-4"}>{children}</div>
    </section>
  );
}
