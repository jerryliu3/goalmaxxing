import { useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS, dateLabel, navigateDate, periodDays, TODAY, type View } from "./model";
import { DayItems, ItemRow, Unplanned } from "./primitives";
import type { Lab } from "./use-lab";

export function CalendarControls({ s }: { s: Lab }) {
  return <div className="il-calendar-controls"><div className="il-date-navigation"><button className="il-icon" aria-label="Previous period" onClick={() => s.chooseDate(navigateDate(s.date, s.view, -1))}><ChevronLeft size={19} /></button><h2>{dateLabel(s.date, "MMMM yyyy")}</h2><button className="il-icon" aria-label="Next period" onClick={() => s.chooseDate(navigateDate(s.date, s.view, 1))}><ChevronRight size={19} /></button><button className="il-text-button" onClick={() => s.chooseDate(TODAY)}>Today</button></div><div className="il-view-switch" aria-label="Calendar view">{(["month", "week", "day", "list"] as View[]).map(v => <button key={v} aria-pressed={v === s.view} onClick={() => s.setView(v)}>{v}</button>)}</div></div>;
}
export function CalendarGrid({ s, mode = s.view === "month" ? "month" : "week", fold = false }: { s: Lab; mode?: "month" | "week"; fold?: boolean }) {
  const days = periodDays(s.date, mode);
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const [over, setOver] = useState<string | null>(null);
  const drop = (e: React.DragEvent, date: string) => {
    e.preventDefault(); setOver(null);
    try { const ids: unknown = JSON.parse(e.dataTransfer.getData("text/plain")); if (Array.isArray(ids) && ids.every(id => typeof id === "string")) s.propose(ids, date); } catch { s.setNotice("Choose an item’s Move button to give it a date."); }
  };
  return <section className={`il-calendar il-calendar-${mode} ${fold ? "il-fold-calendar" : ""}`} aria-label={`${mode} calendar`}>
    <div className="il-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div>
    {weeks.map(week => <div className="il-calendar-week" key={week[0]}><div className="il-calendar-row">{week.map(day => {
      const items = s.items.filter(i => i.date === day);
      return <div key={day} data-date={day} className={`il-date-cell ${day === s.date ? "is-current" : ""} ${day.slice(0, 7) !== s.date.slice(0, 7) ? "is-outside" : ""} ${over === day ? "is-over" : ""}`} onDragOver={e => { e.preventDefault(); setOver(day); }} onDragLeave={() => setOver(null)} onDrop={e => drop(e, day)}>
        <button className="il-date-button" aria-label={`${dateLabel(day, "EEEE, d MMMM yyyy")}${day === TODAY ? ", today" : ""}, ${items.length} items`} aria-pressed={s.date === day} onClick={() => { if (s.selected.length && s.concept === "switchboard") s.propose(s.selected, day); else s.chooseDate(day); }}><span>{dateLabel(day, "d")}</span>{day === TODAY && <small>Today</small>}{s.date === day && <ArrowDown size={13} />}</button>
        <div className="il-cell-items">{items.slice(0, mode === "week" ? 5 : 2).map(item => { const goal = s.data.goals.find(g => g.id === item.goalId); return <button key={item.id} className={`il-calendar-pill ${s.selected.includes(item.id) ? "is-picked" : ""}`} style={{ "--goal-color": COLORS[goal?.category || "Life"] } as CSSProperties} draggable onDragStart={e => { e.dataTransfer.setData("text/plain", JSON.stringify(s.selected.includes(item.id) ? s.selected : [item.id])); }} onClick={() => { s.chooseDate(day); if (s.concept === "switchboard") s.pick(item.id); }} aria-pressed={s.concept === "switchboard" ? s.selected.includes(item.id) : undefined}>{s.selected.includes(item.id) ? "✓ " : ""}{item.title}</button>; })}{items.length > (mode === "week" ? 5 : 2) && <button className="il-more-items" onClick={() => { s.chooseDate(day); if (!fold) s.setView("day"); }}>+{items.length - (mode === "week" ? 5 : 2)} more</button>}</div>
        <div className="il-cell-count" aria-hidden="true">{items.length > 0 && <span>{items.length} items</span>}</div>
      </div>;
    })}</div>{fold && week.includes(s.date) && <div className="il-unfolded" key={s.date}><DayItems s={s} /><button className="il-text-button" onClick={() => s.setView("day")}>Open full day <ArrowUpRight size={15} /></button></div>}</div>)}
  </section>;
}
export function DateList({ s }: { s: Lab }) {
  const dates = periodDays(s.date, "week");
  return <div className="il-agenda">{dates.map(date => <div key={date} className="il-agenda-day"><button className="il-agenda-date" onClick={() => { s.chooseDate(date); s.setView("day"); }}><span>{dateLabel(date, "EEE")}</span><strong>{dateLabel(date, "d")}</strong></button><div>{s.items.filter(i => i.date === date).map(item => <ItemRow key={item.id} item={item} s={s} />)}{!s.items.some(i => i.date === date) && <p className="il-muted">Nothing planned.</p>}</div></div>)}</div>;
}
export function FoldPlanner({ s }: { s: Lab }) {
  return <div className="il-fold-layout"><div className="il-calendar-paper"><CalendarControls s={s} />{s.view === "day" ? <DayItems s={s} /> : s.view === "list" ? <DateList s={s} /> : <CalendarGrid s={s} fold />}</div><aside className="il-side"><Unplanned s={s} /><div className="il-margin-note"><span>Make room.</span><p>Plans can change.<br />Your progress stays yours.</p></div></aside></div>;
}
