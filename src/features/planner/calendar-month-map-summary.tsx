import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import type { CalendarMonthCellEntryBase } from "./calendar-month-day-cell";
import { getGoalVisual } from "./goal-visuals";
import styles from "./calendar-surface.module.css";

/** The date's accessible label owns the full counts; the day list owns actions. */
export function CalendarMonthMapSummary<T extends CalendarMonthCellEntryBase>({
  entries,
  recordedCount,
  isEntryCredited,
}: {
  entries: T[];
  recordedCount: number;
  isEntryCredited: (entry: T) => boolean;
}) {
  const placed = entries.filter((entry) => !entry.draftGhost);
  const done =
    placed.filter((entry) => !entry.draftDiffKind && isEntryCredited(entry))
      .length + recordedCount;
  const marks = placed.slice(0, 3);
  return (
    <div
      className={styles.monthMapSummary}
      aria-hidden="true"
      data-month-map-summary
    >
      <div className={styles.monthMapMarks}>
        {marks.map((entry) => {
          const visual = getGoalVisual({
            goalId: entry.originalGoalId,
            color: entry.activeGoal?.color ?? null,
            category: entry.activeGoal?.category ?? null,
          });
          return (
            <span
              key={entry.key}
              className={styles.monthMapMark}
              style={{ "--map-goal-color": visual.color } as CSSProperties}
            />
          );
        })}
      </div>
      <div className={styles.monthMapCounts}>
        {placed.length > 0 ? <span>{placed.length}</span> : null}
        {done > 0 ? (
          <span className="inline-flex items-center gap-0.5">
            <Check className="size-2.5" />
            {done}
          </span>
        ) : null}
      </div>
    </div>
  );
}
