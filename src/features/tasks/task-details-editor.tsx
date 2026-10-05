"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/client";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { QuestFact, WorkQuestCard } from "@/features/planner/work-quest-card";
import { formatQuestSittingDate, formatQuestSittingTime } from "@/features/planner/work-quest-model";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { editPlannerTask } from "@/lib/tasks/client";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";

type TaskField = "title" | "date" | "time";

export function TaskDetailsEditor({ task, today, onSaved }: {
  task: PlannerCalendarTask;
  today: string;
  onSaved: (task: PlannerCalendarTask) => void;
}) {
  const [editing, setEditing] = useState<TaskField | null>(null);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const fields = {
    ...createDefaultGoalCreationFields(),
    title: task.title,
    start_date: task.scheduledDate,
    end_date: task.scheduledDate,
    default_local_time: task.scheduledTime ?? "",
    difficulty: "easy" as const,
    is_private: true,
    target_count: "1",
    target_basis: "lifetime" as const,
  };
  const dateLabel = formatQuestSittingDate(task.scheduledDate) ?? task.scheduledDate;
  const timeLabel = formatQuestSittingTime(task.scheduledTime) ?? "any time";
  const dismiss = () => {
    if (!savingRef.current) setEditing(null);
  };
  const save = async (field: TaskField, value: string) => {
    if (savingRef.current) return;
    const normalized = field === "title" ? value.trim() : value;
    if ((field !== "time" && !normalized) || normalized === (
      field === "title" ? task.title : field === "date" ? task.scheduledDate : task.scheduledTime ?? ""
    )) {
      setEditing(null);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const updated = await editPlannerTask(task.taskId, task.updatedAt, {
        scheduledDate: field === "date" ? normalized : task.scheduledDate,
        ...(field === "title" ? { title: normalized } : {}),
        ...(field === "time" ? { scheduledTime: normalized || null } : {}),
      });
      setEditing(null);
      onSaved(updated);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update the task."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <section className="plan-row-unfold my-2 min-w-0" aria-label="Edit task" data-plan-entry-editor="true"
      aria-busy={saving}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); dismiss(); }
      }}>
      <WorkQuestCard
        quest={{ id: task.taskId, title: task.title, categoryLabel: "Personal",
          color: fields.color, cadenceLabel: null, deadlineLabel: task.scheduledDate, progress: null,
          completed: Boolean(task.completedAt) }}
        facts={null}
        goalCard={<TempoGoalCard fields={fields} context="history" isTask achieved={Boolean(task.completedAt)}
          taskSchedule={{ date: dateLabel, time: formatQuestSittingTime(task.scheduledTime) ?? "" }}
          visibility={{ category: true, rhythm: false, interval: false, count: false, schedule: true, difficulty: true }} />}
      >
        <div className="space-y-2 text-sm">
          <p className="leading-relaxed">
            {editing === "title" ? (
              <Input autoFocus aria-label="Task name" value={titleDraft} maxLength={200} disabled={saving}
                className="inline-flex h-8 w-full max-w-64" onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={dismiss}
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); void save("title", titleDraft); }
                }} />
            ) : (
              <QuestFact label="Edit task name" disabled={saving}
                onSelect={() => { setTitleDraft(task.title); setEditing("title"); }}>
                {task.title}
              </QuestFact>
            )} scheduled for{" "}
            <QuestFact label="Edit scheduled date" active={editing === "date"} disabled={saving || Boolean(task.completedAt)}
              onSelect={() => setEditing(editing === "date" ? null : "date")}>{dateLabel}</QuestFact>
            {" "}at{" "}
            <QuestFact label="Edit task time" active={editing === "time"} disabled={saving}
              onSelect={() => setEditing(editing === "time" ? null : "time")}>{timeLabel}</QuestFact>.
          </p>
          {editing === "date" && (
            <DateField autoFocus aria-label="Scheduled date" value={task.scheduledDate}
              min={task.scheduledDate < today ? task.scheduledDate : today} disabled={saving}
              onBlur={dismiss} onValueChange={(value) => { void save("date", value); }} />
          )}
          {editing === "time" && (
            <Input autoFocus aria-label="Task time" type="time" step={60} value={task.scheduledTime ?? ""}
              disabled={saving} className="h-8 w-32" onBlur={dismiss}
              onChange={(event) => { void save("time", event.target.value); }} />
          )}
        </div>
      </WorkQuestCard>
    </section>
  );
}
