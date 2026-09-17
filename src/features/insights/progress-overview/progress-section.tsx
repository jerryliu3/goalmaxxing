"use client";

import type { ReactNode } from "react";
import {
  progressSectionElementId,
  type ProgressSectionId,
} from "@/features/insights/progress-overview/progress-view-model";

export interface ProgressSectionProps {
  id: ProgressSectionId;
  title: string;
  /** Set when the content carries its own heading, e.g. inside a card. */
  hideTitle?: boolean;
  children: ReactNode;
}

export function ProgressSection({
  id,
  title,
  hideTitle = false,
  children,
}: ProgressSectionProps) {
  const headingId = `${progressSectionElementId(id)}-title`;

  return (
    <section
      id={progressSectionElementId(id)}
      data-testid={progressSectionElementId(id)}
      data-onboarding={`insights.${id}`}
      aria-labelledby={hideTitle ? undefined : headingId}
      aria-label={hideTitle ? title : undefined}
      className="scroll-mt-28 border-t border-border py-6 first:border-t-0 first:pt-0"
    >
      {hideTitle ? null : (
        <h3
          id={headingId}
          className="font-display text-2xl font-semibold tracking-tight"
        >
          {title}
        </h3>
      )}
      <div className={hideTitle ? undefined : "mt-4"}>{children}</div>
    </section>
  );
}
