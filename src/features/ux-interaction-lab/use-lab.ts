import { useState } from "react";
import { addGoal, createSeed, dateLabel, goalMatches, moveItems, TODAY, toggleCompletion, type Concept, type Destination, type GoalDraft, type Item, type Move, type Snapshot, type View } from "./model";

export function useLab() {
  const [data, setData] = useState(createSeed);
  const [previous, setPrevious] = useState<Snapshot | null>(null);
  const [concept, setConcept] = useState<Concept>("fold");
  const [destination, setDestination] = useState<Destination>("plan");
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(TODAY);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState<Move | null>(null);
  const [notice, setNotice] = useState("Sample data · Changes last until you reload");
  const [creating, setCreating] = useState(false);
  const [activeGoal, setActiveGoal] = useState("g0");
  const [haptics, setHaptics] = useState(false);
  const goals = data.goals.filter(g => goalMatches(g, query, category, goalIds));
  const items = data.items.filter(i => i.goalId ? goals.some(g => g.id === i.goalId) : !goalIds.length && category === "All" && (!query || i.title.toLowerCase().includes(query.toLowerCase())));
  const pulse = () => {
    if (concept === "glide" && haptics && typeof navigator !== "undefined" && typeof navigator.vibrate === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate(12);
  };
  const commit = (next: Snapshot, message: string) => { setPrevious(data); setData(next); setNotice(message); };
  const chooseDate = (next: string) => { setDate(next); pulse(); };
  const toggle = (item: Item, onDate = item.date || date) => {
    if (onDate > TODAY) { setNotice("Choose today or a past date to log a completion."); return; }
    const done = data.records.some(r => r.itemId === item.id && r.date === onDate && r.source === "manual");
    commit(toggleCompletion(data, item, onDate), `${item.title} ${done ? "reopened" : "completed"} · ${dateLabel(onDate)}`); pulse();
  };
  const propose = (ids: string[], target: string | null) => {
    const changedIds = ids.filter(id => data.items.some(i => i.id === id && i.date !== target));
    if (!changedIds.length) { setNotice("These items are already on that date."); return; }
    setPending({ ids: changedIds, date: target });
  };
  const saveMove = () => {
    if (!pending) return;
    commit(moveItems(data, pending), `${pending.ids.length} ${pending.ids.length === 1 ? "item" : "items"} ${pending.date ? `moved to ${dateLabel(pending.date)}` : "left unplanned"} · Saved in this demo`);
    if (pending.date) setDate(pending.date);
    setPending(null); setSelected([]); pulse();
  };
  const pick = (id: string) => setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const toggleGoal = (id: string) => setGoalIds(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const clearFilters = () => { setQuery(""); setCategory("All"); setGoalIds([]); };
  const changeConcept = (next: Concept) => {
    setConcept(next); setSelected([]); setCreating(false);
    setDestination("plan"); setView(next === "fold" ? "month" : next === "index" ? "list" : next === "glide" ? "day" : "week");
  };
  const create = (draft: GoalDraft) => {
    const next = addGoal(data, draft);
    if (next === data) return;
    commit(next, `${draft.title.trim()} created · Find its ${draft.kind === "planner_task" ? "task" : "first steps"} in Unplanned`);
    setCreating(false); clearFilters();
  };
  const undo = () => { if (previous) { setData(previous); setPrevious(null); setPending(null); setNotice("Last change undone"); } };
  const reset = () => { setData(createSeed()); setPrevious(null); setPending(null); setSelected([]); clearFilters(); setDate(TODAY); setNotice("Demo reset"); setCreating(false); };
  return { data, concept, changeConcept, destination, setDestination, view, setView, date, chooseDate, query, setQuery, category, setCategory, goalIds, setGoalIds, toggleGoal, goals, items, clearFilters, selected, setSelected, pick, pending, setPending, propose, saveMove, toggle, notice, setNotice, previous, undo, reset, creating, setCreating, create, activeGoal, setActiveGoal, haptics, setHaptics, commit };
}
export type Lab = ReturnType<typeof useLab>;
