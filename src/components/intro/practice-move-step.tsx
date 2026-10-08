"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { getWorkPillFillStyle } from "@/features/planner/goal-visuals";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { toLocalDateString } from "@/lib/dates/day";
import { cn } from "@/lib/utils";

type Drag = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  over: string | null;
};

function dayAt(offset: number) {
  const date = addDays(new Date(), offset);
  return { date, key: toLocalDateString(date) };
}

function dayFromPoint(x: number, y: number) {
  return document.elementFromPoint(x, y)?.closest("[data-practice-day]")?.getAttribute("data-practice-day") ?? null;
}

export function PracticeMoveStep({ completed, onComplete }: { completed: boolean; onComplete: () => void }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => dayAt(index)), []);
  const home = days[0]!.key;
  const next = days[1]!;
  const [draftDay, setDraftDay] = useState(completed ? next.key : home);
  const dragRef = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const staged = draftDay !== home;
  const pillStyle = getWorkPillFillStyle(createDefaultGoalCreationFields().color);

  const track = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current) return;
    const nextDrag = { ...current, x: event.clientX, y: event.clientY, over: dayFromPoint(event.clientX, event.clientY) };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const day = dayFromPoint(event.clientX, event.clientY);
    dragRef.current = null;
    setDrag(null);
    if (day) setDraftDay(day);
  };

  return (
    <div className="space-y-3">
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="grid min-w-[32rem] grid-cols-7 overflow-hidden rounded-[14px] border border-border bg-background">
          {days.map(({ date, key }, index) => (
            <div
              key={key}
              data-practice-day={key}
              className={cn(
                "flex min-h-36 min-w-0 flex-col p-1.5 sm:p-2",
                index > 0 && "border-l border-border",
                key === home && "bg-muted/40",
                drag?.over === key && "bg-foreground/5"
              )}
            >
              <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{format(date, "EEE")}</p>
              <p className={cn("mb-2 text-sm tabular-nums", index === 0 && "font-medium")}>{format(date, "d")}</p>
              {draftDay === key && (
                <button
                  type="button"
                  disabled={completed}
                  aria-label="Move practice walk"
                  className={cn(
                    "flex min-h-[2.125rem] w-full touch-none items-center rounded-[10px] border px-2 text-left text-[11px] font-medium",
                    drag && "opacity-0"
                  )}
                  style={pillStyle}
                  onPointerDown={(event) => {
                    if (completed || event.button !== 0) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    const nextDrag = {
                      x: event.clientX,
                      y: event.clientY,
                      offsetX: event.clientX - rect.left,
                      offsetY: event.clientY - rect.top,
                      width: rect.width,
                      over: key,
                    };
                    dragRef.current = nextDrag;
                    setDrag(nextDrag);
                    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* jsdom */ }
                  }}
                  onPointerMove={track}
                  onPointerUp={endDrag}
                  onPointerCancel={() => { dragRef.current = null; setDrag(null); }}
                >
                  <span className="truncate">Walk</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {drag && createPortal(
        <div
          className="pointer-events-none fixed z-[90] flex min-h-[2.125rem] items-center rounded-[10px] border px-2 text-[11px] font-medium shadow-[0_12px_28px_-10px_color-mix(in_srgb,var(--foreground)_24%,transparent)]"
          style={{ ...pillStyle, left: drag.x - drag.offsetX, top: drag.y - drag.offsetY, width: drag.width }}
        >
          <span className="truncate">Walk</span>
        </div>,
        document.body
      )}
      {!completed && (
        <div className="flex flex-wrap gap-2">
          {staged ? (
            <>
              <Button onClick={onComplete}>Save practice move</Button>
              <Button variant="outline" onClick={() => setDraftDay(home)}>Undo</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setDraftDay(next.key)}>
              Move to {format(next.date, "EEEE")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
