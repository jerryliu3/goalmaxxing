import { useState } from "react";
import { ArrowLeft, ArrowUpRight, LayoutList } from "lucide-react";
import { CalendarControls, CalendarGrid } from "./calendar";
import { GoalIndex } from "./goal-index";
import { DayItems, Empty, ItemRow, Unplanned } from "./primitives";
import { dateLabel, goalLabel } from "./model";
import type { Lab } from "./use-lab";

export function IndexPlanner({ s }: { s: Lab }) {
  const [all, setAll] = useState(false);
  const [opened, setOpened] = useState(false);
  const active = s.goals.find((g) => g.id === s.activeGoal) || s.goals[0];
  const scoped: Lab =
    all || !active
      ? s
      : {
          ...s,
          items: s.items.filter((i) => i.goalId === active.id),
          goals: [active],
        };
  const upcoming = scoped.items
    .filter((i) => !i.date || i.date >= s.date)
    .toSorted((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    <div className={`il-index-planner ${opened ? "has-open-goal" : ""}`}>
      <GoalIndex
        goals={s.goals}
        activeId={all ? null : active?.id || null}
        onCreate={() => s.setCreating(true)}
        onSelect={(id) => {
          s.setActiveGoal(id);
          setAll(false);
          setOpened(true);
        }}
      />
      <section className="il-index-workspace">
        <button
          className="il-index-back il-text-button"
          onClick={() => setOpened(false)}
        >
          <ArrowLeft size={16} />
          Goal index
        </button>
        <header className="il-index-workspace-header">
          <div>
            <span className="il-eyebrow">
              {all ? "Your whole plan" : active?.category || "Your goals"}
            </span>
            <h2>
              {all
                ? "Everything, in its place."
                : active?.title || "No matching goals"}
            </h2>
            <p>
              {all
                ? "All goals and one-time tasks"
                : active
                  ? goalLabel(active)
                  : "Clear the filters to see your collection."}
            </p>
          </div>
          <div>
            <button
              className="il-secondary"
              aria-pressed={all}
              onClick={() => {
                setAll(!all);
                setOpened(true);
              }}
            >
              <LayoutList size={16} />
              {all ? "Selected goal" : "Whole plan"}
            </button>
            {active && !all && (
              <button
                className="il-text-button"
                onClick={() => {
                  s.setGoalIds([active.id]);
                  s.setDestination("progress");
                }}
              >
                Inspect progress <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </header>
        <div className="il-calendar-paper">
          <CalendarControls s={scoped} />
          {s.view === "month" || s.view === "week" ? (
            <>
              <CalendarGrid s={scoped} />
              <DayItems s={scoped} />
            </>
          ) : s.view === "day" ? (
            <DayItems s={scoped} />
          ) : (
            <section className="il-index-occurrences">
              <div className="il-section-heading">
                <h3>Next occurrences</h3>
                <span className="il-count">From {dateLabel(s.date)}</span>
              </div>
              {upcoming.map((item) => (
                <div className="il-index-occurrence" key={item.id}>
                  <span>
                    {item.date
                      ? dateLabel(item.date, "EEE, d MMM")
                      : "Unplanned"}
                  </span>
                  <ItemRow item={item} s={scoped} />
                </div>
              ))}
              {!upcoming.length && (
                <Empty>
                  No occurrences after this date in the sample.
                  <button
                    className="il-text-button"
                    onClick={() => s.setCreating(true)}
                  >
                    Create a goal to try placing its first occurrence
                  </button>
                </Empty>
              )}
            </section>
          )}
        </div>
        {s.view !== "list" && <Unplanned s={scoped} />}
      </section>
    </div>
  );
}
