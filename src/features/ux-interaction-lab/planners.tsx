import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  MoveRight,
  X,
} from "lucide-react";
import {
  CalendarControls,
  CalendarGrid,
  DateList,
  FoldPlanner,
} from "./calendar";
import { DayItems, ItemRow, Unplanned } from "./primitives";
import { dateLabel, offsetDate, periodDays } from "./model";
import { IndexPlanner } from "./index-planner";
import { LensPlanner } from "./lens-planner";
import type { Lab } from "./use-lab";

export function Planner({ s }: { s: Lab }) {
  if (s.concept === "index") return <IndexPlanner s={s} />;
  if (s.concept === "lens") return <LensPlanner s={s} />;
  if (s.concept === "fold") return <FoldPlanner s={s} />;
  if (s.concept === "glide") return <GlidePlanner s={s} />;
  return <SwitchboardPlanner s={s} />;
}
function SwitchboardPlanner({ s }: { s: Lab }) {
  const [target, setTarget] = useState(s.date);
  const [phase, setPhase] = useState<"pick" | "place">("pick");
  const selected = s.data.items.filter((i) => s.selected.includes(i.id));
  return (
    <div className={`il-board-layout ${phase === "place" ? "is-placing" : ""}`}>
      <nav className="il-board-phase-nav" aria-label="Rearrange your plan">
        <button
          aria-pressed={phase === "pick"}
          onClick={() => setPhase("pick")}
        >
          1 · Select work {s.selected.length ? `(${s.selected.length})` : ""}
        </button>
        <button
          aria-pressed={phase === "place"}
          onClick={() => setPhase("place")}
        >
          2 · Choose date
        </button>
      </nav>
      <aside className="il-pickup">
        <div className="il-section-heading">
          <h2>Pick up & place</h2>
          <span className="il-count">01 → 02</span>
        </div>
        <p>Select work here or on the calendar. Then choose its next date.</p>
        <DayItems s={s} />
        <Unplanned s={s} />
      </aside>
      <section className="il-board-main">
        <div className="il-calendar-paper">
          <CalendarControls s={s} />
          {s.view === "day" ? (
            <DayItems s={s} />
          ) : s.view === "list" ? (
            <DateList s={s} />
          ) : (
            <CalendarGrid s={s} />
          )}
        </div>
        <div
          className={`il-pickup-tray ${selected.length ? "has-selection" : ""}`}
        >
          <div>
            <span className="il-eyebrow">In your hand</span>
            <h3>
              {selected.length
                ? `${selected.length} items selected`
                : "Pick something up"}
            </h3>
            <p>
              {selected.length
                ? selected.map((i) => i.title).join(" + ")
                : "Your selection stays here while you find the right date."}
            </p>
          </div>
          {selected.length > 0 && (
            <>
              <label>
                <span className="il-sr-only">Date for selected items</span>
                <input
                  type="date"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </label>
              <button
                className="il-primary"
                disabled={!target}
                onClick={() => s.propose(s.selected, target)}
              >
                Review move <MoveRight size={16} />
              </button>
              <button
                className="il-icon"
                aria-label="Clear selection"
                onClick={() => s.setSelected([])}
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
function GlidePlanner({ s }: { s: Lab }) {
  const [expanded, setExpanded] = useState(false);
  const [unplanned, setUnplanned] = useState(false);
  const days = periodDays(s.date, "week");
  const todayItems = s.items.filter((i) => i.date === s.date);
  const done = todayItems.filter((i) =>
    s.data.records.some((r) => r.itemId === i.id && r.date === s.date),
  ).length;
  return (
    <div className="il-glide-layout">
      <section className="il-glide-calendar">
        <CalendarControls s={s} />
        {s.view === "month" ? (
          <CalendarGrid s={s} mode="month" />
        ) : s.view === "week" ? (
          <CalendarGrid s={s} mode="week" />
        ) : s.view === "list" ? (
          <DateList s={s} />
        ) : (
          <div className="il-glide-day">
            <span className="il-eyebrow">{dateLabel(s.date, "MMMM yyyy")}</span>
            <h2>{dateLabel(s.date, "EEEE")}</h2>
            <div className="il-big-date">
              {dateLabel(s.date, "d")}
              <span>
                {todayItems.length
                  ? `${done} of ${todayItems.length}`
                  : "Open day"}
                <small>
                  {todayItems.length
                    ? "planned items complete"
                    : "Make it your own"}
                </small>
              </span>
            </div>
            <div className="il-day-pips" aria-hidden="true">
              {todayItems.map((item, i) => (
                <span key={item.id} className={i < done ? "is-done" : ""} />
              ))}
            </div>
            <p>No rush. One thing at a time.</p>
          </div>
        )}
        <div className="il-thumb-rail">
          <button
            className="il-icon"
            aria-label="Previous week"
            onClick={() => s.chooseDate(offsetDate(s.date, -7))}
          >
            <ChevronLeft size={18} />
          </button>
          {days.map((date) => (
            <button
              key={date}
              aria-pressed={s.date === date}
              onClick={() => s.chooseDate(date)}
            >
              <span>{dateLabel(date, "EEEEE")}</span>
              <strong>{dateLabel(date, "d")}</strong>
            </button>
          ))}
          <button
            className="il-icon"
            aria-label="Next week"
            onClick={() => s.chooseDate(offsetDate(s.date, 7))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
      <section className={`il-glide-dock ${expanded ? "is-expanded" : ""}`}>
        <div className="il-dock-handle" aria-hidden="true" />
        <div className="il-section-heading">
          <div>
            <span className="il-eyebrow">
              {dateLabel(s.date, "EEEE, d MMM")}
            </span>
            <h2>{unplanned ? "Room for later" : "Within reach"}</h2>
          </div>
          <button
            className="il-secondary"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Compact" : "Expand"}
            {expanded ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
          </button>
        </div>
        <div className="il-dock-tabs">
          <button aria-pressed={!unplanned} onClick={() => setUnplanned(false)}>
            This day · {todayItems.length}
          </button>
          <button aria-pressed={unplanned} onClick={() => setUnplanned(true)}>
            Unplanned · {s.items.filter((i) => !i.date).length}
          </button>
        </div>
        <div className="il-dock-content">
          {unplanned ? (
            <Unplanned s={s} />
          ) : todayItems.length ? (
            todayItems.map((item) => (
              <ItemRow key={item.id} item={item} s={s} />
            ))
          ) : (
            <p className="il-empty">
              Nothing planned. Move something from Unplanned when you’re ready.
            </p>
          )}
        </div>
        <label className="il-haptics">
          <input
            type="checkbox"
            checked={s.haptics}
            onChange={(e) => {
              s.setHaptics(e.target.checked);
              s.setNotice(
                e.target.checked
                  ? "Tactile feedback enabled where the browser and device support vibration."
                  : "Tactile feedback off",
              );
            }}
          />
          <span>
            Optional tactile feedback
            <small>
              Supported devices only · always paired with visible feedback
            </small>
          </span>
          <Check size={14} />
        </label>
      </section>
    </div>
  );
}
