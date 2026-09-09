import { useState } from "react";
import {
  SEED,
  type Item,
  completeItem,
  planMove,
  lightenDay,
  changesBetween,
} from "./model";
export function useStudy() {
  const [items, setItems] = useState<Item[]>(() => SEED.map((x) => ({ ...x })));
  const [day, setDay] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Item[] | null>(null);
  const [previous, setPrevious] = useState<Item[] | null>(null);
  const [notice, setNotice] = useState(
    "Demo data · Changes stay in this session",
  );
  const [budget, setBudget] = useState(100);
  const [filter, setFilter] = useState("All goals");
  const [joined, setJoined] = useState(false);
  const commit = (next: Item[], message: string) => {
    setPrevious(items);
    setItems(next);
    setNotice(message);
  };
  const toggle = (id: string) => {
    const item = items.find((x) => x.id === id);
    if (!item || item.day === null) return;
    commit(
      completeItem(items, id),
      `${item.title} ${item.done ? "reopened" : "completed"} · ${item.day + 7} September`,
    );
    setSelected(null);
  };
  const move = (id: string, target: number | null) => {
    setDraft(planMove(items, id, target));
    setSelected(null);
  };
  const save = () => {
    if (draft) {
      commit(draft, "Plan saved for this demo");
      setDraft(null);
    }
  };
  const undo = () => {
    if (previous) {
      setItems(previous);
      setPrevious(null);
      setDraft(null);
      setNotice("Last change undone");
    }
  };
  const reset = () => {
    setItems(SEED.map((x) => ({ ...x })));
    setDay(1);
    setDraft(null);
    setPrevious(null);
    setSelected(null);
    setBudget(100);
    setFilter("All goals");
    setJoined(false);
    setNotice("Demo reset");
  };
  return {
    items,
    day,
    setDay,
    selected,
    setSelected,
    draft,
    setDraft,
    previous,
    notice,
    budget,
    setBudget,
    filter,
    setFilter,
    joined,
    setJoined,
    toggle,
    move,
    save,
    undo,
    reset,
    lighten: () => setDraft(lightenDay(items, day, budget)),
    changes: draft ? changesBetween(items, draft) : [],
    active: items.find((x) => x.id === selected),
    today: items
      .filter((x) => x.day === day)
      .sort((a, b) => a.time.localeCompare(b.time)),
    unplanned: items.filter((x) => x.day === null),
    done: items.filter((x) => x.done).length,
  };
}
export type Study = ReturnType<typeof useStudy>;
