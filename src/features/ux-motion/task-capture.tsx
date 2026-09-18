"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompletionToggle } from "@/components/ui/completion-toggle";

interface SampleTask { id: number; title: string; done: boolean }

export function TaskCapture({ still }: { still: boolean }) {
  const [title, setTitle] = useState("Send the project notes");
  const [tasks, setTasks] = useState<SampleTask[]>([]);
  const [tearing, setTearing] = useState<SampleTask | null>(null);
  const nextId = useRef(1);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tearing) return;
    const timer = window.setTimeout(() => setTearing(null), still ? 0 : 950);
    return () => window.clearTimeout(timer);
  }, [tearing, still]);

  function add(event: FormEvent) {
    event.preventDefault();
    const text = title.trim();
    if (!text || tearing) return;
    const task = { id: nextId.current++, title: text, done: false };
    // Sample persistence is immediate. Motion never owns creation of the task.
    setTasks(current => [task, ...current]);
    setTearing(still ? null : task);
    setTitle("");
    input.current?.focus();
  }

  return <section className="mt-7" aria-labelledby="motion-tasks-heading">
    <h2 id="motion-tasks-heading" className="mb-4 font-display text-2xl">One-time tasks</h2>
    <form onSubmit={add} className="motion-study-notepad">
      <label htmlFor="motion-task-title" className="text-xs uppercase tracking-wider text-muted-foreground">A task for today</label>
      <div className="mt-2 flex items-center gap-2">
        <Input ref={input} id="motion-task-title" value={title} maxLength={160} onChange={event => setTitle(event.target.value)} placeholder="Add another task…" />
        <Button type="submit" disabled={!title.trim() || Boolean(tearing)}>Add</Button>
      </div>
      {tearing && <div className="motion-study-tear" aria-hidden="true" key={tearing.id} />}
    </form>
    <div className="motion-study-task-list">
      {tasks.length === 0 && <p className="py-4 text-sm text-muted-foreground">No one-time tasks yet.</p>}
      {tasks.map(task => <motion.div key={task.id} className="motion-study-task-row"
        initial={still ? false : { y: -78, rotateX: -12, rotateZ: -2, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, rotateZ: 0, opacity: 1 }}
        transition={{ duration: still ? 0 : 0.65, delay: still ? 0 : 0.28, ease: [0.22, 0.8, 0.2, 1] }}>
        <CompletionToggle completed={task.done} size="md" aria-label={`${task.done ? "Reopen" : "Complete"} ${task.title}`}
          onClick={() => setTasks(current => current.map(item => item.id === task.id ? { ...item, done: !item.done } : item))} />
        <span className={task.done ? "line-through text-muted-foreground" : ""}>{task.title}</span>
      </motion.div>)}
    </div>
    <p className="mt-2 text-xs text-muted-foreground" role="status">{tearing ? "Task added · the slip is settling" : tasks.length ? `${tasks.length} sample tasks · ready for the next` : "Add a task to try the tear-off."}</p>
  </section>;
}
