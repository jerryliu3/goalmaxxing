"use client";

import { format, parseISO } from "date-fns";
import { CONCEPT_PARTNER_NAME, CONCEPT_VIEWER_NAME, itemsOnDate } from "@/features/ux-concepts/seed";
import { partnerWeekItems } from "@/features/ux-concepts/destination-seed";
import { WorkPill } from "@/features/ux-concepts/concept-primitives";
import type { ConceptSession } from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

export function SharedWeekBoard({
  session,
  days,
  onOpenDay,
}: {
  session: ConceptSession;
  days: Date[];
  onOpenDay: (iso: string) => void;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-label="Shared week board">
      <BoardColumn
        name={CONCEPT_VIEWER_NAME}
        days={days}
        session={session}
        whose="self"
        onOpenDay={onOpenDay}
      />
      <BoardColumn
        name={CONCEPT_PARTNER_NAME}
        days={days}
        session={session}
        whose="partner"
        onOpenDay={onOpenDay}
      />
    </div>
  );
}

function BoardColumn({
  name,
  days,
  session,
  whose,
  onOpenDay,
}: {
  name: string;
  days: Date[];
  session: ConceptSession;
  whose: "self" | "partner";
  onOpenDay: (iso: string) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold">{name}</h2>
      <ol className="mt-2">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const selfItems = itemsOnDate(iso, session.recoveredTo);
          const partnerItems = partnerWeekItems.filter(
            (item) => item.date === iso
          );
          const hasItems =
            whose === "self" ? selfItems.length > 0 : partnerItems.length > 0;
          return (
            <li key={`${name}-${iso}`} className="border-b border-border/50 py-2">
              <button
                type="button"
                onClick={() => onOpenDay(iso)}
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground touch-manipulation"
                aria-label={format(parseISO(iso), "EEEE, MMM d")}
              >
                {format(day, "EEE d")}
              </button>
              {!hasItems ? (
                <p className="py-1 text-sm text-muted-foreground">—</p>
              ) : whose === "self" ? (
                <div className="mt-1 flex flex-col gap-1.5">
                  {selfItems.map((item) => (
                    <WorkPill
                      key={item.id}
                      item={item}
                      completed={session.isComplete(item.id)}
                      unplaced={item.id === "strength" && !session.recovered}
                      onClick={() => {
                        if (item.id === "strength" && !session.recovered) {
                          session.setSelectedDate(iso);
                          session.setRecoverOpen(true);
                          return;
                        }
                        onOpenDay(iso);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-1 flex flex-col gap-1">
                  {partnerItems.map((item) => (
                    <p
                      key={item.id}
                      className={cn(
                        "rounded-lg bg-violet-50 px-2.5 py-1.5 text-sm ring-1 ring-violet-200/70",
                        item.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {item.title}
                    </p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
