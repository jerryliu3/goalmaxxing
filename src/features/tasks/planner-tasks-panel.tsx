"use client";

import { PlannerDraggableEntry } from "@/features/planner/calendar-dnd";
import { ChevronDown, Loader2, Trash2 } from "lucide-react";
import { completePlannerTask, createPlannerTask } from "@/lib/tasks/client";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";
import { TaskDetailsEditor } from "./task-details-editor";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { requestXpRefresh } from "@/lib/xp/events";
import { orderPlannerTasks } from "@cadence/shared/planner/task-order";
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
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import { toLocalDateString } from "@/lib/dates/day";
import { createClient } from "@/lib/supabase/client";
import { planCompletionControlModeForDate } from "@/features/planner/completion-entry-dispatch";
import { planLedgerTitleClass } from "@/features/planner/calendar-day-chrome";
import { useOutsidePointerDismiss } from "@/lib/ui/use-outside-pointer-dismiss";
import { captureTaskSlip, TaskCaptureSlip, type TaskCaptureSlipState } from "./task-capture-slip";
import "./task-capture-motion.css";

interface PlannerTaskRow {
  task_id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const plannerTasksCache = new Map<string, PlannerTaskRow[]>();

function plannerTasksCacheKey(date: string | null): string {
  return date ?? "__all__";
}

function readPlannerTasksCache(date: string | null): PlannerTaskRow[] | undefined {
  return plannerTasksCache.get(plannerTasksCacheKey(date));
}

function writePlannerTasksCache(date: string | null, tasks: PlannerTaskRow[]) {
  plannerTasksCache.set(plannerTasksCacheKey(date), tasks);
}

export function clearPlannerTasksCacheForTests() {
  plannerTasksCache.clear();
}

export function PlannerTasksPrefetch({
  scheduledDate,
  onCountChange,
}: {
  scheduledDate: string | null;
  onCountChange?: (count: number) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    const cached = readPlannerTasksCache(scheduledDate);
    if (cached) {
      onCountChange?.(cached.length);
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.rpc("list_planner_tasks", {
        p_for_date: scheduledDate ?? undefined,
      });
      if (cancelled || error) {
        return;
      }
      const tasks = orderPlannerTasks((data ?? []) as PlannerTaskRow[]);
      writePlannerTasksCache(scheduledDate, tasks);
      onCountChange?.(tasks.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [onCountChange, scheduledDate, supabase]);
  return null;
}

interface PlannerTasksPanelProps {
  selectedTaskId?: string | null;
  allowDrag?: boolean;
  title?: string;
  description?: string | null;
  scheduledDate?: string | null;
  asOfDate?: string | null;
  showScheduledDate?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
  hideWhenEmpty?: boolean;
  chrome?: "card" | "plain";
  onCountChange?: (count: number) => void;
}

export function PlannerTasksPanel({
  selectedTaskId = null,
  allowDrag = false,
  title = "One time tasks",
  description = "Track simple one-time tasks separately from recurring goals.",
  scheduledDate = null,
  asOfDate = null,
  showScheduledDate = false,
  allowCreate = true,
  allowDelete = false,
  hideWhenEmpty = false,
  chrome = "card",
  onCountChange,
}: PlannerTasksPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const cachedTasks = readPlannerTasksCache(scheduledDate);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(selectedTaskId);
  useEffect(() => { setExpandedTaskId(selectedTaskId); }, [selectedTaskId]);
  const [tasks, setTasks] = useState<PlannerTaskRow[]>(() => cachedTasks ?? []);
  const [loading, setLoading] = useState(() => cachedTasks === undefined);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(() => cachedTasks !== undefined);
  const [adding, setAdding] = useState(false);
  const addingRef = useRef(false);
  const [capture, setCapture] = useState<TaskCaptureSlipState | null>(null);
  const captureTargetRef = useRef<HTMLSpanElement>(null);
  const finishCapture = useCallback(() => setCapture(null), []);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [confirmingDeleteTask, setConfirmingDeleteTask] = useState<PlannerTaskRow | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [newTaskDate, setNewTaskDate] = useState(
    () => scheduledDate && scheduledDate >= (asOfDate ?? toLocalDateString()) ? scheduledDate : (asOfDate ?? toLocalDateString())
  );
  const completionAsOfDate = asOfDate ?? toLocalDateString();
  const canAddTask = newTaskTitle.trim().length > 0;
  const scheduledDateRef = useRef<string | null>(scheduledDate);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    onCountChange?.(tasks.length);
  }, [onCountChange, tasks.length]);

  const loadTasks = useCallback(
    async (
      forDate: string | null = scheduledDateRef.current,
      options?: { background?: boolean }
    ) => {
      const requestVersion = ++requestVersionRef.current;
      const cached = readPlannerTasksCache(forDate);
      if (cached && !options?.background) {
        setTasks(cached);
        setHasLoadedOnce(true);
      }
      if (!options?.background && cached === undefined) {
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
      const next = orderPlannerTasks((data ?? []) as PlannerTaskRow[]);
      setTasks(next);
      writePlannerTasksCache(forDate, next);
      setHasLoadedOnce(true);
      if (!options?.background) {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    scheduledDateRef.current = scheduledDate;
    void loadTasks(scheduledDate);
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

  useEffect(() => {
    if (!composerOpen) {
      return;
    }
    titleInputRef.current?.focus();
  }, [composerOpen]);

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
  }, []);

  useOutsidePointerDismiss({
    enabled: composerOpen,
    containerRef: composerRef,
    onDismiss: closeComposer,
  });

  const addTask = useCallback(async () => {
    if (!allowCreate || addingRef.current) {
      return;
    }
    const title = newTaskTitle.trim();
    if (!title) {
      return;
    }
    setAdding(true);
    addingRef.current = true;
    try {
      const result = await createPlannerTask(title, newTaskDate);
      const created: PlannerTaskRow = {
        task_id: result.taskId, title: result.title, scheduled_date: result.scheduledDate,
        scheduled_time: result.scheduledTime, completed_at: result.completedAt,
        created_at: result.createdAt ?? new Date().toISOString(), updated_at: result.updatedAt,
      };
      if (!scheduledDateRef.current || created.scheduled_date <= scheduledDateRef.current) {
        // The returned row is committed. Keep the composer ready for the next task.
        if (titleInputRef.current) {
          setCapture(captureTaskSlip(titleInputRef.current, created.task_id, title));
        }
        setTasks(current => {
          const next = [created, ...current.filter(task => task.task_id !== created.task_id)];
          writePlannerTasksCache(scheduledDateRef.current, next);
          return next;
        });
        titleInputRef.current?.focus();
      }
      setNewTaskTitle(current => current.trim() === title ? "" : current);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Task could not be created."));
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
  }, [allowCreate, newTaskDate, newTaskTitle]);

  const toggleTask = useCallback(
    async (task: PlannerTaskRow) => {
      const completionMode = planCompletionControlModeForDate({
        currentlyCredited: task.completed_at != null,
        selectedDate: task.scheduled_date,
        asOfDate: completionAsOfDate,
      });
      if (completionMode !== "toggle") {
        return;
      }
      const nextCompleted = task.completed_at == null;
      setTogglingTaskId(task.task_id);
      setTasks((current) => {
        const next = current.map((row) =>
          row.task_id === task.task_id
            ? {
                ...row,
                completed_at: nextCompleted ? new Date().toISOString() : null,
              }
            : row
        );
        writePlannerTasksCache(scheduledDateRef.current, next);
        return next;
      });
      try {
        const updated = await completePlannerTask(task.task_id, task.updated_at, nextCompleted);
        setTasks(current => {
          const next = current.map(row => row.task_id === task.task_id ? {
            ...row, completed_at: updated.completedAt, updated_at: updated.updatedAt,
          } : row);
          writePlannerTasksCache(scheduledDateRef.current, next);
          return next;
        });
      } catch (error) {
        setTasks(current => {
          const next = current.map(row => row.task_id === task.task_id ? task : row);
          writePlannerTasksCache(scheduledDateRef.current, next);
          return next;
        });
        toast.error(getApiErrorMessage(error, "Task completion could not be updated."));
      } finally {
        setTogglingTaskId(null);
      }
    },
    [completionAsOfDate]
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
        const next = current.filter((row) => row.task_id !== task.task_id);
        writePlannerTasksCache(scheduledDateRef.current, next);
        return next;
      });
      try {
        const { error } = await supabase.rpc("delete_planner_task", {
          p_task_id: task.task_id,
        });
        if (!error) {
          invalidatePlannerRelatedTabCaches();
          requestXpRefresh();
        }
        if (error) {
          setTasks(previousTasks);
          writePlannerTasksCache(scheduledDateRef.current, previousTasks);
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

  const composerFieldClassName =
    "h-8 rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent";

  const addForm = allowCreate && composerOpen ? (
    <div ref={composerRef} className="task-capture-composer space-y-2">
      <Input
        ref={titleInputRef}
        value={newTaskTitle}
        readOnly={adding}
        onChange={(event) => setNewTaskTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (canAddTask) {
              void addTask();
            }
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setComposerOpen(false);
          }
        }}
        placeholder="Add a task..."
        maxLength={200}
        className={composerFieldClassName}
      />
      <div className="flex items-center gap-2">
        <DateField
          value={newTaskDate}
          min={completionAsOfDate}
          onValueChange={setNewTaskDate}
          aria-label="Task date"
          className={cn(composerFieldClassName, "min-w-0 flex-1")}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => void addTask()}
          disabled={adding || !canAddTask}
        >
          {adding ? <Loader2 className="size-4 animate-spin" /> : null}
          Add
        </Button>
      </div>
    </div>
  ) : null;

  const addNewButton =
    allowCreate && !composerOpen ? (
      <button
        type="button"
        className="py-1 text-left text-xs font-medium text-primary touch-manipulation"
        onClick={() => setComposerOpen(true)}
      >
        + Add new
      </button>
    ) : null;

  const taskList =
    loading && tasks.length === 0 ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading tasks...
      </div>
    ) : tasks.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        {allowCreate
          ? "No tasks yet."
          : "No tasks scheduled for this day yet."}
      </p>
    ) : (
      <ul className={chrome === "plain" ? "divide-y" : "space-y-2"}>
        {tasks.map((task) => {
          const complete = task.completed_at != null;
          const toggling = togglingTaskId === task.task_id;
          const deleting = deletingTaskId === task.task_id;
          const busy = toggling || deleting;
          const completionMode = planCompletionControlModeForDate({
            currentlyCredited: complete,
            selectedDate: task.scheduled_date,
            asOfDate: completionAsOfDate,
          });
          const titleClass = complete
            ? `${planLedgerTitleClass} text-muted-foreground line-through`
            : chrome === "plain"
              ? planLedgerTitleClass
              : undefined;
          const mark =
            toggling ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : completionMode === "toggle" ? (
              <StyleCompletionMark
                done={complete}
                className={
                  complete
                    ? "size-4 shrink-0 text-primary"
                    : "size-4 shrink-0 text-muted-foreground"
                }
              />
            ) : completionMode === "done" ? (
              <StyleCompletionMark
                done
                className="size-4 shrink-0 text-primary"
                label="Completed"
              />
            ) : null;
          const title = <span ref={capture?.taskId === task.task_id ? captureTargetRef : undefined} className={titleClass}>{task.title}</span>;
          return (
            <li
              key={task.task_id}
              style={{ visibility: capture?.taskId === task.task_id ? "hidden" : undefined }}
              className={
                chrome === "plain"
                  ? "space-y-2 py-3 last:pb-0.5"
                  : "space-y-2 rounded-md border px-3 py-2 last:mb-0"
              }
            >
              <div className="flex items-center justify-between gap-3">
              {completionMode === "toggle" ? (
                <button type="button" aria-label={`${complete ? "Undo completion for" : "Complete"} ${task.title}`}
                  className="-m-2 flex size-9 shrink-0 items-center justify-center" onClick={() => void toggleTask(task)} disabled={busy}>
                  {mark}
                </button>
              ) : mark}
              <PlannerDraggableEntry entryKey={`task:${task.task_id}`} day={task.scheduled_date}
                surface="checklist" disabled={!allowDrag || complete || busy}>
                {({ setNodeRef, setActivatorNodeRef, attributes, listeners, style, isDragging }) => (
                  <button ref={(node) => { setNodeRef(node); setActivatorNodeRef(node); }} type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    style={{ ...style, opacity: isDragging ? 0 : undefined }}
                    {...attributes} {...(!allowDrag || complete || busy ? {} : listeners)}
                    data-planner-entry-key={`task:${task.task_id}`}
                    aria-disabled={undefined}
                    aria-expanded={expandedTaskId === task.task_id}
                    onClick={() => {
                      if (!isDragging) setExpandedTaskId(current => current === task.task_id ? null : task.task_id);
                    }}>
                    {title}
                    <ChevronDown className={cn("size-3 shrink-0 text-muted-foreground", expandedTaskId === task.task_id && "rotate-180")} />
                  </button>
                )}
              </PlannerDraggableEntry>
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
                    <Loader2 className="animate-spin text-destructive" />
                  ) : (
                    <Trash2 className="text-destructive" />
                  )}
                </Button>
              ) : null}
              </div>
              {expandedTaskId === task.task_id ? (
                <TaskDetailsEditor key={`${task.task_id}:${task.updated_at}`} today={completionAsOfDate}
                  task={{ taskId: task.task_id, title: task.title, scheduledDate: task.scheduled_date,
                    scheduledTime: task.scheduled_time, completedAt: task.completed_at, updatedAt: task.updated_at }}
                  onCancel={() => setExpandedTaskId(null)}
                  onSaved={(updated: PlannerCalendarTask) => {
                    setTasks(current => {
                      const next = current.map(row => row.task_id === updated.taskId ? {
                        ...row, title: updated.title, scheduled_date: updated.scheduledDate,
                        scheduled_time: updated.scheduledTime, updated_at: updated.updatedAt,
                      } : row).filter(row => !scheduledDateRef.current || row.scheduled_date <= scheduledDateRef.current);
                      writePlannerTasksCache(scheduledDateRef.current, next);
                      return next;
                    });
                    setExpandedTaskId(null);
                  }} />
              ) : null}
            </li>
          );
        })}
      </ul>
    );

  const deleteDialog = (
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
  );

  const captureSlip = capture ? (
    <TaskCaptureSlip key={capture.taskId} capture={capture} targetRef={captureTargetRef} onDone={finishCapture} />
  ) : null;

  if (chrome === "plain") {
    return (
      <div className="space-y-1">
        {addForm}
        {addNewButton}
        {taskList}
        {deleteDialog}
        {captureSlip}
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-1">
        {addForm}
        {addNewButton}
        {taskList}
      </CardContent>
      {deleteDialog}
      {captureSlip}
    </Card>
  );
}
