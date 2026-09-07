"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import { DateField } from "@/components/ui/date-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import { toLocalDateString } from "@/lib/dates/day";
import { createClient } from "@/lib/supabase/client";

interface PlannerTaskRow {
  task_id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PlannerTasksPanelProps {
  title?: string;
  description?: string | null;
  scheduledDate?: string | null;
  showScheduledDate?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
  hideWhenEmpty?: boolean;
}

export function PlannerTasksPanel({
  title = "Tasks",
  description = "Track simple one-time tasks separately from recurring goals.",
  scheduledDate = null,
  showScheduledDate = false,
  allowCreate = true,
  allowDelete = false,
  hideWhenEmpty = false,
}: PlannerTasksPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<PlannerTaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [adding, setAdding] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [confirmingDeleteTask, setConfirmingDeleteTask] = useState<PlannerTaskRow | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(
    () => scheduledDate ?? toLocalDateString()
  );
  const canAddTask = newTaskTitle.trim().length > 0;
  const scheduledDateRef = useRef<string | null>(scheduledDate);
  const requestVersionRef = useRef(0);

  const loadTasks = useCallback(
    async (
      forDate: string | null = scheduledDateRef.current,
      options?: { background?: boolean }
    ) => {
      const requestVersion = ++requestVersionRef.current;
      if (!options?.background) {
        setLoading(true);
      }
      const { data, error } = await supabase.rpc("list_planner_tasks", {
        p_for_date: forDate ?? undefined,
      });
      if (requestVersion !== requestVersionRef.current) {
        return;
      }
      if (error) {
        toast.error(error.message || "Could not load tasks.");
        setHasLoadedOnce(true);
        if (!options?.background) {
          setLoading(false);
        }
        return;
      }
      setTasks((data ?? []) as PlannerTaskRow[]);
      setHasLoadedOnce(true);
      if (!options?.background) {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    scheduledDateRef.current = scheduledDate;
    const timer = window.setTimeout(() => {
      void loadTasks(scheduledDate);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadTasks, scheduledDate]);

  usePlannerTabCacheInvalidation(() => {
    void loadTasks(scheduledDateRef.current, { background: true });
  });

  useEffect(
    () => () => {
      requestVersionRef.current += 1;
    },
    []
  );

  const addTask = useCallback(async () => {
    if (!allowCreate) {
      return;
    }
    const title = newTaskTitle.trim();
    if (!title) {
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.rpc("create_planner_task", {
        p_title: title,
        p_scheduled_date: newTaskDate.trim() || undefined,
      });
      if (error) {
        toast.error(error.message || "Task could not be created.");
        return;
      }
      setNewTaskTitle("");
      await loadTasks(scheduledDateRef.current);
    } finally {
      setAdding(false);
    }
  }, [allowCreate, loadTasks, newTaskDate, newTaskTitle, supabase]);

  const toggleTask = useCallback(
    async (task: PlannerTaskRow) => {
      const nextCompleted = task.completed_at == null;
      setTogglingTaskId(task.task_id);
      setTasks((current) =>
        current.map((row) =>
          row.task_id === task.task_id
            ? {
                ...row,
                completed_at: nextCompleted ? new Date().toISOString() : null,
              }
            : row
        )
      );
      try {
        const { error } = await supabase.rpc("set_planner_task_completion", {
          p_task_id: task.task_id,
          p_completed: nextCompleted,
        });
        if (error) {
          setTasks((current) =>
            current.map((row) => (row.task_id === task.task_id ? task : row))
          );
          toast.error(error.message || "Task completion could not be updated.");
        }
      } finally {
        setTogglingTaskId(null);
      }
    },
    [supabase]
  );

  const deleteTask = useCallback(
    async (task: PlannerTaskRow) => {
      if (!allowDelete) {
        return;
      }
      setDeletingTaskId(task.task_id);
      let previousTasks: PlannerTaskRow[] = [];
      setTasks((current) => {
        previousTasks = current;
        return current.filter((row) => row.task_id !== task.task_id);
      });
      try {
        const { error } = await supabase.rpc("delete_planner_task", {
          p_task_id: task.task_id,
        });
        if (error) {
          setTasks(previousTasks);
          toast.error(error.message || "Task could not be deleted.");
        }
      } finally {
        setDeletingTaskId(null);
      }
    },
    [allowDelete, supabase]
  );

  const requestDeleteTask = useCallback(
    (task: PlannerTaskRow) => {
      if (!allowDelete) {
        return;
      }
      setConfirmingDeleteTask(task);
    },
    [allowDelete]
  );

  if (hideWhenEmpty && (!hasLoadedOnce || tasks.length === 0)) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {allowCreate ? (
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (canAddTask) {
                    void addTask();
                  }
                }
              }}
              placeholder="Add a task..."
              maxLength={200}
            />
            <DateField
              value={newTaskDate}
              onValueChange={setNewTaskDate}
              aria-label="Task date"
              className="h-8 w-[150px] shrink-0"
            />
            <Button
              type="button"
              onClick={() => void addTask()}
              disabled={adding || !canAddTask}
            >
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading && tasks.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {allowCreate
              ? "No tasks yet. Add one to keep your planner focused."
              : "No tasks scheduled for this day yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const complete = task.completed_at != null;
              const toggling = togglingTaskId === task.task_id;
              const deleting = deletingTaskId === task.task_id;
              const busy = toggling || deleting;
              return (
                <li
                  key={task.task_id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => void toggleTask(task)}
                    disabled={busy}
                  >
                    {toggling ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <StyleCompletionMark
                        done={complete}
                        className={
                          complete
                            ? "size-4 shrink-0 text-primary"
                            : "size-4 shrink-0 text-muted-foreground"
                        }
                      />
                    )}
                    <span className={complete ? "text-muted-foreground line-through" : ""}>
                      {task.title}
                    </span>
                  </button>
                  {task.scheduled_time ? (
                    <Badge variant="outline">{task.scheduled_time}</Badge>
                  ) : null}
                  {showScheduledDate ? (
                    <Badge variant="outline">{task.scheduled_date}</Badge>
                  ) : null}
                  {allowDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete task ${task.title}`}
                      title="Delete task"
                      onClick={() => requestDeleteTask(task)}
                      disabled={busy}
                    >
                      {deleting ? (
                        <Loader2 className="size-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="size-4 text-destructive" />
                      )}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <Dialog
        open={confirmingDeleteTask !== null}
        onOpenChange={(open) => {
          if (deletingTaskId) {
            return;
          }
          if (!open) {
            setConfirmingDeleteTask(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              {confirmingDeleteTask
                ? `This permanently deletes "${confirmingDeleteTask.title}".`
                : "This permanently deletes this task."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingDeleteTask(null)}
              disabled={Boolean(deletingTaskId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!confirmingDeleteTask || Boolean(deletingTaskId)}
              onClick={() => {
                if (!confirmingDeleteTask) {
                  return;
                }
                void deleteTask(confirmingDeleteTask).then(() => {
                  setConfirmingDeleteTask(null);
                });
              }}
            >
              {deletingTaskId ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
