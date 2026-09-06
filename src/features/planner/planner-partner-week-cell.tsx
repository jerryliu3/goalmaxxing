import { NestCompletionMark } from "@/components/ui/nest-completion-mark";
import type { PlannerCompletionFactMarker } from "@/features/planner/calendar-surface.types";

export function PlannerPartnerWeekDayCell({
  day,
  inMonth,
  isToday,
  markers,
}: {
  day: string;
  inMonth: boolean;
  isToday: boolean;
  markers: PlannerCompletionFactMarker[];
}) {
  return (
    <div
      className={`relative min-h-24 rounded-sm border p-2 text-left ${
        inMonth
          ? isToday
            ? "bg-primary/10 ring-1 ring-primary/50"
            : "bg-background"
          : "border-muted-foreground/40 bg-muted/80 text-muted-foreground"
      }`}
      data-day={day}
      data-partner-week-cell="true"
    >
      <p
        className={`text-xs font-semibold leading-none ${
          isToday ? "text-primary" : "text-foreground"
        }`}
      >
        {day.slice(8, 10)}
      </p>
      {markers.length > 0 ? (
        <div className="mt-3 space-y-1">
          {markers.map((marker) => (
            <div
              key={marker.key}
              className="flex items-center gap-1.5 rounded-md border-2 border-primary bg-transparent px-1.5 py-1 text-[11px] text-primary"
            >
              <NestCompletionMark done className="size-3 shrink-0" />
              <span className="truncate">{marker.goalTitle}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
