"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlannerDndProvider, PlannerDraggableEntry, PlannerDroppableDay } from "@/features/planner/calendar-dnd";
import { getWorkPillFillStyle } from "@/features/planner/goal-visuals";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { toLocalDateString } from "@/lib/dates/day";
import { cn } from "@/lib/utils";

export function PracticeMoveStep({ completed, onComplete }: { completed: boolean; onComplete: () => void }) {
  const dates = useMemo(() => [new Date(), addDays(new Date(), 1)], []);
  const days = dates.map(toLocalDateString);
  const [draftDay, setDraftDay] = useState(completed ? days[1] : days[0]);
  const staged = draftDay === days[1];
  const pillStyle = getWorkPillFillStyle(createDefaultGoalCreationFields().color);
  return <div className="space-y-4">
    <p className="text-muted-foreground">Drag this session to {format(dates[1], "EEEE")}. In Agenda, moving a session opens Planning mode: Save keeps the change, and Undo puts it back.</p>
    <PlannerDndProvider getEntryLabel={() => "Practice walk"} getDayLabel={day => day}
      onEntryDragStart={() => {}} onEntryDragCancel={() => {}}
      renderDragOverlay={() => <div className="rounded-lg border px-3 py-2" style={pillStyle}>Practice walk</div>}
      onEntryDragEnd={(_key, target) => { if (target?.type === "day" && target.day === days[1]) setDraftDay(days[1]); }}>
      <div className="grid grid-cols-2 gap-3">
        {days.map((day, index) => <PlannerDroppableDay key={day} day={day}>
          {({ setNodeRef, isOver }) => <div ref={setNodeRef} className={cn("min-h-36 rounded-xl border p-3", isOver && "bg-accent ring-2 ring-ring")}>
            <p className="mb-4 text-sm text-muted-foreground">{format(dates[index], "EEE, MMM d")}</p>
            {draftDay === day && <PlannerDraggableEntry entryKey="onboarding-practice" day={day} disabled={completed}>
              {({ setNodeRef, setActivatorNodeRef, attributes, listeners, style, isDragging }) => <button type="button"
                ref={node => { setNodeRef(node); setActivatorNodeRef(node); }} {...attributes} {...listeners}
                className={cn("flex w-full touch-none items-center gap-2 rounded-lg border px-2 py-3 text-left text-sm", isDragging && "opacity-0")}
                style={{ ...pillStyle, ...style }} aria-label="Move practice walk">
                <GripVertical className="size-4 shrink-0" aria-hidden />Practice walk
              </button>}
            </PlannerDraggableEntry>}
          </div>}
        </PlannerDroppableDay>)}
      </div>
    </PlannerDndProvider>
    {!completed && <div className="flex flex-wrap gap-2">
      {staged ? <><Button onClick={onComplete}>Save practice move</Button><Button variant="outline" onClick={() => setDraftDay(days[0])}>Undo</Button></>
        : <Button variant="outline" onClick={() => setDraftDay(days[1])}>Move to {format(dates[1], "EEEE")}</Button>}
    </div>}
    <p role="status" className="text-sm text-muted-foreground">{completed ? "Move saved. Your plan follows you." : staged ? "Planning mode · Save or Undo this practice move." : "Grab the session, or use the Move button."}</p>
  </div>;
}
