"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/client";
import { createPlannerTask } from "@/lib/tasks/client";

function CalendarTaskComposer({ day, onClose }: { day: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const save = async () => {
    if (savingRef.current || !title.trim()) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await createPlannerTask(title.trim(), day);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create the task."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return (
    <form className="rounded-md border border-primary/40 bg-background p-1"
      data-task-composer="true"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <Input autoFocus placeholder="Task name" aria-label="Task name" value={title}
        maxLength={200} readOnly={saving} className="h-7 min-w-0 border-0 px-1 text-sm shadow-none"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Escape" && !saving) { event.preventDefault(); onClose(); }
        }} />
      <button type="submit" disabled={saving || !title.trim()} className="sr-only">Create task</button>
    </form>
  );
}

export function useCalendarTaskCapture({ today, readOnly, revealTasks }: {
  today: string; readOnly: boolean; revealTasks: () => void;
}) {
  const [captureDay, setCaptureDay] = useState<string | null>(null);
  const close = useCallback(() => setCaptureDay(null), []);
  const open = useCallback((day: string) => {
    if (readOnly || day < today) return;
    revealTasks();
    setCaptureDay(day);
  }, [readOnly, revealTasks, today]);
  const render = useCallback((day: string) => captureDay === day
    ? <CalendarTaskComposer key={day} day={day} onClose={close} /> : null, [captureDay, close]);
  return { open, render };
}
