"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  progressSectionElementId,
  type ProgressSectionId,
} from "@/features/insights/progress-overview/progress-view-model";
import { cn } from "@/lib/utils";

export interface ProgressSectionProps {
  id: ProgressSectionId;
  title: string;
  subtitle?: ReactNode;
  /** Right-aligned headline fact, e.g. "6 of 12 completed". */
  meta?: ReactNode;
  /** Always-visible condensed view of the section. */
  summary: ReactNode;
  /** Revealed when the section is expanded. */
  detail?: ReactNode;
  /** Noun used by the expand control, e.g. "history" -> "Inspect history". */
  detailLabel?: string;
  expanded: boolean;
  onToggle: () => void;
}

export function ProgressSection({
  id,
  title,
  subtitle,
  meta,
  summary,
  detail,
  detailLabel,
  expanded,
  onToggle,
}: ProgressSectionProps) {
  const headingId = `${progressSectionElementId(id)}-title`;
  const detailId = `${progressSectionElementId(id)}-detail`;
  const noun = detailLabel ?? title.toLowerCase();

  return (
    <section
      id={progressSectionElementId(id)}
      data-testid={progressSectionElementId(id)}
      data-onboarding={`insights.${id}`}
      aria-labelledby={headingId}
      className="scroll-mt-28 border-t border-border py-6 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3
          id={headingId}
          className="font-display text-2xl font-semibold tracking-tight"
        >
          {title}
        </h3>
        {meta ? (
          <p className="font-sans text-sm text-muted-foreground">{meta}</p>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-1 font-sans text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
      <div className="mt-4">{summary}</div>
      {detail ? (
        <>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-primary hover:text-primary"
              aria-expanded={expanded}
              aria-controls={expanded ? detailId : undefined}
              onClick={onToggle}
            >
              {expanded ? `Hide ${noun}` : `Inspect ${noun}`}
              <ChevronDown
                className={cn("size-4 transition-transform", expanded && "rotate-180")}
                aria-hidden="true"
              />
            </Button>
          </div>
          {expanded ? (
            <div id={detailId} className="mt-2">
              {detail}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
