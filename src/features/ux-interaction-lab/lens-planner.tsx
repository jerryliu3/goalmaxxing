import { useState } from "react";
import { ArrowUpRight, Check, Layers, Plus, Save, X } from "lucide-react";
import { COLORS, CATEGORIES, datesWithEveryGoal, periodDays } from "./model";
import { CalendarControls, CalendarGrid, DateList } from "./calendar";
import { DayItems, Unplanned } from "./primitives";
import type { Lab } from "./use-lab";

export function LensComposer({ s }: { s: Lab }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const chosen = s.data.goals.filter((g) => s.goalIds.includes(g.id));
  const save = () => {
    if (!name.trim() || !chosen.length) return;
    s.setLenses([
      ...s.lenses,
      {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        goalIds: [...s.goalIds],
        match: s.lensMatch,
      },
    ]);
    s.setNotice(`“${name.trim()}” saved for this demo session`);
    setSaving(false);
    setName("");
  };
  return (
    <section className="il-lens-composer" aria-label="Lens workspace">
      <div className="il-saved-lenses">
        <span>
          <Layers size={16} />
          Lenses
        </span>
        <button aria-pressed={!chosen.length} onClick={s.clearFilters}>
          Everything
        </button>
        {s.lenses.map((lens) => (
          <div className="il-saved-lens" key={lens.id}>
            <button
              aria-pressed={
                lens.match === s.lensMatch &&
                lens.goalIds.length === chosen.length &&
                lens.goalIds.every((id) => s.goalIds.includes(id))
              }
              onClick={() => {
                s.clearFilters();
                s.setGoalIds(lens.goalIds);
                s.setLensMatch(lens.match);
              }}
            >
              {lens.name}
            </button>
            {lens.id.startsWith("custom-") && (
              <button
                className="il-remove-lens"
                aria-label={`Remove lens ${lens.name}`}
                onClick={() =>
                  s.setLenses(s.lenses.filter((l) => l.id !== lens.id))
                }
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="il-lens-equation">
        <span className="il-eyebrow">My view</span>
        <div className="il-lens-tokens">
          {chosen.length ? (
            chosen.map((g, i) => (
              <span className="il-lens-term" key={g.id}>
                {i > 0 && <Plus size={14} />}
                <button
                  onClick={() => s.toggleGoal(g.id)}
                  aria-label={`Remove ${g.title} from lens`}
                >
                  <span
                    className="il-goal-dot"
                    style={{ background: COLORS[g.category] }}
                  />
                  {g.title}
                  <X size={13} />
                </button>
              </span>
            ))
          ) : (
            <span className="il-lens-all">All goals & tasks</span>
          )}
          <button
            className="il-lens-add"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Plus size={16} />
            {open ? "Done choosing" : "Choose goals"}
          </button>
        </div>
        {chosen.length > 0 && (
          <button className="il-text-button" onClick={() => setSaving(!saving)}>
            <Save size={15} />
            Save lens
          </button>
        )}
      </div>
      {saving && (
        <form
          className="il-save-lens"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label>
            <span className="il-sr-only">Lens name</span>
            <input
              autoFocus
              placeholder="Name this combination…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="il-primary"
            disabled={!name.trim() || !chosen.length}
          >
            Save combination
          </button>
          <button
            type="button"
            className="il-icon"
            aria-label="Cancel saving lens"
            onClick={() => setSaving(false)}
          >
            <X size={16} />
          </button>
        </form>
      )}
      {open && (
        <div className="il-lens-palette">
          <div className="il-section-heading">
            <label>
              <span className="il-sr-only">Find goals for the lens</span>
              <input
                value={search}
                placeholder="Find a goal…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button
              className="il-icon"
              aria-label="Close goal palette"
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          </div>
          <div className="il-lens-palette-groups">
            {CATEGORIES.map((category) => (
              <fieldset key={category}>
                <legend>{category}</legend>
                {s.data.goals
                  .filter(
                    (g) =>
                      g.category === category &&
                      g.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((g) => (
                    <button
                      key={g.id}
                      aria-pressed={s.goalIds.includes(g.id)}
                      onClick={() => s.toggleGoal(g.id)}
                    >
                      <span className="il-lens-check">
                        {s.goalIds.includes(g.id) && <Check size={13} />}
                      </span>
                      {g.title}
                    </button>
                  ))}
              </fieldset>
            ))}
          </div>
          {!s.data.goals.some((g) =>
            g.title.toLowerCase().includes(search.toLowerCase()),
          ) && <p>No goals match this search.</p>}
        </div>
      )}
      <div className="il-lens-rule">
        <span>Show days with</span>
        <button
          aria-pressed={s.lensMatch === "any"}
          onClick={() => s.setLensMatch("any")}
        >
          Any chosen goal
        </button>
        <button
          disabled={chosen.length < 2}
          aria-pressed={s.lensMatch === "all"}
          onClick={() => s.setLensMatch("all")}
        >
          All chosen goals
        </button>
        <span className="il-lens-rule-help">
          {s.lensMatch === "all" && chosen.length > 1
            ? "Only days where the selected goals overlap"
            : "Each selected goal can appear independently"}
        </span>
      </div>
    </section>
  );
}
export function LensPlanner({ s }: { s: Lab }) {
  const matches = datesWithEveryGoal(s.items, s.goalIds);
  const strict = s.lensMatch === "all" && s.goalIds.length > 1;
  const scoped = strict
    ? { ...s, items: s.items.filter((i) => i.date && matches.has(i.date)) }
    : s;
  const dates =
    s.view === "day"
      ? [s.date]
      : periodDays(s.date, s.view === "month" ? "month" : "week");
  const count = scoped.items.filter(
    (i) => i.date && dates.includes(i.date),
  ).length;
  return (
    <div className="il-lens-layout">
      <LensComposer s={s} />
      <div className="il-lens-results">
        <div className="il-calendar-paper">
          <CalendarControls s={s} />
          {s.view === "month" || s.view === "week" ? (
            <CalendarGrid s={scoped} />
          ) : s.view === "day" ? (
            <DayItems s={scoped} />
          ) : (
            <DateList s={scoped} />
          )}
        </div>
        <aside className="il-lens-inspector">
          <div className="il-lens-result-count">
            <span className="il-eyebrow">In this period</span>
            <strong>{count}</strong>
            <span>matching planned items</span>
            <button
              className="il-text-button"
              onClick={() => s.setDestination("progress")}
            >
              Follow this lens into history <ArrowUpRight size={15} />
            </button>
          </div>
          {s.view !== "day" && <DayItems s={scoped} />}
          <details className="il-lens-unplanned">
            <summary>
              Unplanned · {s.items.filter((i) => !i.date).length}
            </summary>
            <Unplanned s={s} />
          </details>
        </aside>
      </div>
    </div>
  );
}
