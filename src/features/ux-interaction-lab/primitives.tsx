import { useState, type CSSProperties } from "react";
import { ArrowRight, Check, ChevronDown, GripVertical, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { COLORS, dateLabel, goalLabel, TODAY, type Item } from "./model";
import type { Lab } from "./use-lab";

export function ItemRow({ item, s, compact = false }: { item: Item; s: Lab; compact?: boolean }) {
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState(item.date || s.date);
  const goal = s.data.goals.find(g => g.id === item.goalId);
  const done = s.data.records.some(r => r.itemId === item.id && r.date === (item.date || s.date) && r.source === "manual");
  return <article className={`il-item ${done ? "is-done" : ""} ${compact ? "is-compact" : ""} ${s.selected.includes(item.id) ? "is-picked" : ""}`} style={{ "--goal-color": COLORS[goal?.category || "Life"] } as CSSProperties}>
    <div className="il-item-line">
      {s.concept === "switchboard" ? <button className="il-pick" aria-label={`Select ${item.title}`} aria-pressed={s.selected.includes(item.id)} onClick={() => s.pick(item.id)}>{s.selected.includes(item.id) ? <Check size={16} /> : <Plus size={15} />}</button> : <button className="il-complete" aria-label={`${done ? "Reopen" : "Complete"} ${item.title}`} aria-pressed={done} disabled={(item.date || s.date) > TODAY} onClick={() => s.toggle(item)}>{done && <Check size={15} />}</button>}
      <button className="il-item-name" onClick={() => setMoving(!moving)} aria-expanded={moving}>
        <strong>{item.title}</strong><span>{compact ? item.time || (goal ? goalLabel(goal) : "One-time task") : `${item.time ? `${item.time} · ` : ""}${goal ? goalLabel(goal) : "One-time task"}${item.date ? "" : " · Unplanned"}`}</span>
      </button>
      <button className="il-icon il-move-trigger" aria-label={`Move ${item.title}`} onClick={() => setMoving(!moving)}><ArrowRight size={17} /></button>
      <span className="il-drag-handle" draggable onDragStart={e => { e.dataTransfer.setData("text/plain", JSON.stringify(s.selected.includes(item.id) ? s.selected : [item.id])); e.dataTransfer.effectAllowed = "move"; }} aria-hidden="true"><GripVertical size={15} /></span>
    </div>
    {moving && <div className="il-item-edit">
      <label>Move to<input aria-label={`New date for ${item.title}`} type="date" value={target} onChange={e => setTarget(e.target.value)} /></label>
      <button className="il-primary" disabled={!target} onClick={() => { s.propose([item.id], target); setMoving(false); }}>Review move</button>
      <button className="il-text-button" onClick={() => { s.propose([item.id], null); setMoving(false); }}>Leave unplanned</button>
      {s.concept === "switchboard" && <button onClick={() => s.toggle(item)} disabled={(item.date || s.date) > TODAY}>{done ? "Reopen" : "Complete"}</button>}
      <button className="il-icon" aria-label="Close item details" onClick={() => setMoving(false)}><X size={16} /></button>
    </div>}
  </article>;
}
export function Empty({ children }: { children: React.ReactNode }) { return <div className="il-empty">{children}</div>; }
export function DayItems({ s, date = s.date, title = true }: { s: Lab; date?: string; title?: boolean }) {
  const items = s.items.filter(i => i.date === date);
  return <section className="il-day-items" aria-label={`Items for ${dateLabel(date)}`}>
    {title && <header className="il-section-heading"><div><span className="il-eyebrow">{date === TODAY ? "Today" : dateLabel(date, "EEEE")}</span><h2>{dateLabel(date, "d MMMM")}</h2></div><span className="il-count">{items.length} items</span></header>}
    {items.map(item => <ItemRow key={item.id} item={item} s={s} />)}
    {!items.length && <Empty>Room for whatever comes next.<button onClick={() => s.setCreating(true)} className="il-text-button">Add a goal or task <Plus size={14} /></button></Empty>}
  </section>;
}
export function Unplanned({ s }: { s: Lab }) {
  const items = s.items.filter(i => !i.date);
  return <section className="il-unplanned"><header className="il-section-heading"><h2>Unplanned</h2><span className="il-count">{items.length}</span></header><p>A place to keep things flexible.</p>{items.map(item => <ItemRow key={item.id} item={item} s={s} compact />)}{!items.length && <Empty>Everything here has a date.</Empty>}</section>;
}
export function MoveReview({ s }: { s: Lab }) {
  return <Dialog open={!!s.pending} onOpenChange={open => { if (!open) s.setPending(null); }}><DialogContent className={`il-dialog il-theme-${s.concept}`} overlayClassName="il-overlay" showCloseButton={false}>
    <div className="il-section-heading"><DialogTitle>Give it a new place</DialogTitle><DialogClose className="il-icon" aria-label="Cancel move"><X size={19} /></DialogClose></div>
    <DialogDescription>Review this change before saving it in the demo.</DialogDescription>
    <div className="il-review-list">{s.pending?.ids.map(id => { const item = s.data.items.find(i => i.id === id)!; return <div key={id}><strong>{item.title}</strong><span>{item.date ? dateLabel(item.date) : "Unplanned"}<ArrowRight size={16} />{s.pending?.date ? dateLabel(s.pending.date) : "Unplanned"}</span></div>; })}</div>
    {s.pending?.ids.some(id => s.data.records.some(r => r.itemId === id)) && <p>Existing completion records keep their original dates. This changes the plan only.</p>}
    <div className="il-actions"><DialogClose className="il-secondary">Cancel</DialogClose><button className="il-primary" onClick={s.saveMove}>Save move <Check size={16} /></button></div>
  </DialogContent></Dialog>;
}
export function FilterBar({ s }: { s: Lab }) {
  const [open, setOpen] = useState(false);
  return <section className="il-filters" aria-label="Goal filters"><div className="il-filter-line"><label className="il-search"><span className="il-sr-only">Search goals and tasks</span><input placeholder="Find a goal or task…" value={s.query} onChange={e => s.setQuery(e.target.value)} /></label><button className="il-secondary" aria-expanded={open} onClick={() => setOpen(!open)}>Goals {s.goalIds.length ? `(${s.goalIds.length})` : ""}<ChevronDown size={15} /></button>{(s.query || s.goalIds.length || s.category !== "All") ? <button className="il-text-button" onClick={s.clearFilters}>Clear filters</button> : null}</div>{open && <div className="il-filter-options"><div className="il-section-heading"><strong>Choose any combination</strong><button onClick={() => setOpen(false)} className="il-icon" aria-label="Close filters"><X size={17} /></button></div><div className="il-goal-chips">{s.data.goals.map(g => <button key={g.id} aria-pressed={s.goalIds.includes(g.id)} onClick={() => s.toggleGoal(g.id)}>{s.goalIds.includes(g.id) && <Check size={14} />}{g.title}</button>)}</div></div>}{s.goalIds.length > 0 && <p className="il-scope">Showing {s.goalIds.map(id => s.data.goals.find(g => g.id === id)?.title).join(" + ")}</p>}</section>;
}
