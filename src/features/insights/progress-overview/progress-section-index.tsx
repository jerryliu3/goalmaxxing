"use client";

import {
  PROGRESS_VIEWS,
  progressSectionsForView,
  type ProgressSectionId,
} from "@/features/insights/progress-overview/progress-view-model";
import { cn } from "@/lib/utils";

/**
 * Wide-screen index of the Progress sections, grouped by view. Selecting an
 * entry switches to its view and jumps to the section.
 */
export function ProgressSectionIndex({
  availableSectionIds,
  activeSectionId,
  onSelect,
  className,
}: {
  availableSectionIds: readonly ProgressSectionId[];
  activeSectionId: ProgressSectionId | null;
  onSelect: (id: ProgressSectionId) => void;
  className?: string;
}) {
  const available = new Set(availableSectionIds);
  const groups = PROGRESS_VIEWS.map((view) => ({
    view,
    sections: progressSectionsForView(view.value).filter((section) =>
      available.has(section.id)
    ),
  })).filter((group) => group.sections.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Progress sections"
      data-testid="progress-section-index"
      className={cn("space-y-6", className)}
    >
      {groups.map((group) => (
        <div key={group.view.value}>
          <p className="pl-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group.view.label}
          </p>
          <ul className="mt-2 border-l border-border">
            {group.sections.map((section) => {
              const active = section.id === activeSectionId;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(section.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "-ml-px flex min-h-9 w-full items-center border-l-2 py-1.5 pl-3 pr-2 text-left font-sans text-sm transition-colors",
                      active
                        ? "border-primary bg-muted/50 font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                  >
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
