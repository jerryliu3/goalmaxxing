"use client";

import { Archive, CalendarClock } from "lucide-react";
import type { ReactNode } from "react";
import { NestCompletionMark } from "@/components/ui/nest-completion-mark";
import { CollapsibleGoalSection } from "@/features/today/collapsible-goal-section";
import type { Goal } from "@/lib/goals/types";

export function ChecklistPastPanels({
  upcoming,
  pastGoals,
  archivedGoals,
  showUpcoming,
  showEnded,
  showArchived,
  upcomingOpen,
  pastPanelOpen,
  archiveOpen,
  onUpcomingOpenChange,
  onPastPanelOpenChange,
  onArchiveOpenChange,
  renderGoal,
}: {
  upcoming: Goal[];
  pastGoals: Goal[];
  archivedGoals: Goal[];
  showUpcoming: boolean;
  showEnded: boolean;
  showArchived: boolean;
  upcomingOpen: boolean;
  pastPanelOpen: boolean;
  archiveOpen: boolean;
  onUpcomingOpenChange: (open: boolean) => void;
  onPastPanelOpenChange: (open: boolean) => void;
  onArchiveOpenChange: (open: boolean) => void;
  renderGoal: (goal: Goal, options?: { archived?: boolean; key?: string }) => ReactNode;
}) {
  return (
    <>
      {showUpcoming ? (
        <CollapsibleGoalSection
          open={upcomingOpen}
          onOpenChange={onUpcomingOpenChange}
          title="Upcoming"
          count={upcoming.length}
          icon={<CalendarClock className="size-4 text-muted-foreground" />}
          emptyMessage="No future goals yet."
        >
          {upcoming.map((goal) => renderGoal(goal, { key: goal.id }))}
        </CollapsibleGoalSection>
      ) : null}

      {showEnded ? (
        <CollapsibleGoalSection
          open={pastPanelOpen}
          onOpenChange={onPastPanelOpenChange}
          title="Past"
          count={pastGoals.length}
          icon={<NestCompletionMark done className="size-4 text-muted-foreground" />}
          emptyMessage="No past goals yet."
        >
          {pastGoals.map((goal) => renderGoal(goal, { key: goal.id }))}
        </CollapsibleGoalSection>
      ) : null}

      {showArchived ? (
        <CollapsibleGoalSection
          open={archiveOpen}
          onOpenChange={onArchiveOpenChange}
          title="Archived"
          count={archivedGoals.length}
          icon={<Archive className="size-4 text-muted-foreground" />}
          emptyMessage="No archived goals yet."
        >
          {archivedGoals.map((goal) =>
            renderGoal(goal, {
              key: goal.id,
              archived: true,
            })
          )}
        </CollapsibleGoalSection>
      ) : null}
    </>
  );
}
