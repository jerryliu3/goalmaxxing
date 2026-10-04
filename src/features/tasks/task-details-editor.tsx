"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/client";
import { editPlannerTask } from "@/lib/tasks/client";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";

export function TaskDetailsEditor({ task, today, onSaved, onCancel }: {
  task: PlannerCalendarTask; today: string;
  onSaved: (task: PlannerCalendarTask) => void; onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [date, setDate] = useState(task.scheduledDate);
  const [time, setTime] = useState(task.scheduledTime ?? "");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const save = async () => {
    if (savingRef.current || !title.trim() || !date) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const updated = await editPlannerTask(task.taskId, task.updatedAt, {
        title: title.trim(), scheduledDate: date, scheduledTime: time || null,
      });
      onSaved(updated);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save the task."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return (
    <form className="space-y-3 rounded-md border bg-muted/20 p-3"
      data-plan-entry-editor="true" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <label className="block space-y-1 text-xs">Task name
        <Input aria-label="Task name" value={title} maxLength={200} disabled={saving}
          onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="space-y-1 text-xs">Scheduled date
          <DateField aria-label="Scheduled date" value={date} min={date === task.scheduledDate && date < today ? date : today}
            disabled={saving || Boolean(task.completedAt)} onValueChange={setDate} />
        </label>
        <label className="space-y-1 text-xs">Time (optional)
          <Input aria-label="Task time" type="time" value={time} disabled={saving}
            className="h-8 w-32" onChange={(event) => setTime(event.target.value)} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">One occurrence · Easy{task.completedAt ? " · Undo completion before moving this task." : ""}</p>
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={saving || !title.trim() || !date}>{saving ? "Saving..." : "Save task"}</Button>
        <Button size="sm" variant="ghost" type="button" disabled={saving} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
