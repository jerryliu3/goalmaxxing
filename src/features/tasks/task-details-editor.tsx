"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/client";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { WorkQuestCard } from "@/features/planner/work-quest-card";
import { formatQuestSittingDate, formatQuestSittingTime } from "@/features/planner/work-quest-model";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { editPlannerTask } from "@/lib/tasks/client";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";

export function TaskDetailsEditor({ task, today, onSaved, onCancel }: {
  task: PlannerCalendarTask; today: string;
  onSaved: (task: PlannerCalendarTask) => void; onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [date, setDate] = useState(task.scheduledDate);
  const [time, setTime] = useState(task.scheduledTime ?? "");
  const fields = {
    ...createDefaultGoalCreationFields(),
    title,
    start_date: date,
    end_date: date,
    default_local_time: time,
    difficulty: "easy" as const,
    is_private: true,
    target_count: "1",
    target_basis: "lifetime" as const,
  };
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
    <section className="plan-row-unfold my-2 min-w-0" aria-label="Edit task" data-plan-entry-editor="true">
      <WorkQuestCard
        quest={{ id: task.taskId, title: title.trim() || task.title, categoryLabel: "Personal",
          color: fields.color, cadenceLabel: null, deadlineLabel: date, progress: null,
          completed: Boolean(task.completedAt) }}
        facts={null}
        goalCard={<TempoGoalCard fields={fields} context="history" isTask achieved={Boolean(task.completedAt)}
          taskSchedule={{ date: formatQuestSittingDate(date) ?? date, time: formatQuestSittingTime(time) ?? "" }}
          visibility={{ category: true, rhythm: false, interval: false, count: false, schedule: true, difficulty: true }} />}
      >
    <form className="space-y-3"
      onSubmit={(event) => { event.preventDefault(); void save(); }}>
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
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={saving || !title.trim() || !date}>{saving ? "Saving..." : "Save task"}</Button>
        <Button size="sm" variant="ghost" type="button" disabled={saving} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
      </WorkQuestCard>
    </section>
  );
}
