import { useRef, useState } from "react";
import {
  ArrowDownAZ,
  ChevronRight,
  ListFilter,
  Lock,
  Plus,
  Search,
} from "lucide-react";
import { CATEGORIES, COLORS, goalLabel, type DemoGoal } from "./model";
import { Empty } from "./primitives";

/** The index is shared by the goal library and Index's planner. */
export function GoalIndex({
  goals,
  activeId,
  onSelect,
  onCreate,
}: {
  goals: DemoGoal[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [alphabetical, setAlphabetical] = useState(false);
  const [compact, setCompact] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const matching = goals.filter((g) =>
    g.title.toLowerCase().includes(query.toLowerCase()),
  );
  const groups = alphabetical
    ? [
        {
          label: "A–Z",
          goals: matching.toSorted((a, b) => a.title.localeCompare(b.title)),
        },
      ]
    : CATEGORIES.map((label) => ({
        label,
        goals: matching.filter((g) => g.category === label),
      }));
  const jump = (category: string) => {
    const heading = scroll.current?.querySelector<HTMLElement>(
      `[data-category="${category}"]`,
    );
    if (heading && scroll.current)
      scroll.current.scrollTo({
        top: heading.parentElement?.offsetTop || 0,
        behavior: "auto",
      });
  };
  return (
    <section
      className={`il-index ${compact ? "is-condensed" : ""}`}
      aria-label="Goal index"
    >
      <header className="il-section-heading">
        <div>
          <span className="il-eyebrow">Your collection</span>
          <h2>
            Goals <span className="il-count">{goals.length}</span>
          </h2>
        </div>
        <button
          className="il-icon"
          aria-label="Create a goal from the index"
          onClick={onCreate}
        >
          <Plus size={19} />
        </button>
      </header>
      <label className="il-index-search">
        <Search size={16} />
        <span className="il-sr-only">Search the goal index</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find your next thing…"
        />
      </label>
      <div className="il-index-tools">
        <button
          aria-pressed={alphabetical}
          onClick={() => setAlphabetical(!alphabetical)}
        >
          <ArrowDownAZ size={15} />
          {alphabetical ? "A–Z" : "Categories"}
        </button>
        <button aria-pressed={compact} onClick={() => setCompact(!compact)}>
          <ListFilter size={15} />
          {compact ? "Roomy" : "Compact"}
        </button>
      </div>
      {!alphabetical && (
        <nav className="il-category-rail" aria-label="Jump to goal category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              disabled={!matching.some((g) => g.category === c)}
              onClick={() => jump(c)}
            >
              {c}
            </button>
          ))}
        </nav>
      )}
      <div className="il-index-scroll" ref={scroll}>
        {groups
          .filter((g) => g.goals.length)
          .map((group) => (
            <div key={group.label}>
              <h3 className="il-index-heading" data-category={group.label}>
                {group.label}
                <span>{group.goals.length}</span>
              </h3>
              {group.goals.map((g, i) => (
                <button
                  key={g.id}
                  className={`il-index-row ${activeId === g.id ? "is-active" : ""}`}
                  aria-pressed={activeId === g.id}
                  onClick={() => onSelect(g.id)}
                >
                  <span className="il-index-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="il-goal-dot"
                    style={{ background: COLORS[g.category] }}
                  />
                  <span className="il-index-label">
                    <strong>{g.title}</strong>
                    <small>{goalLabel(g)}</small>
                  </span>
                  {g.is_private && <Lock size={13} />}
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          ))}
        {!matching.length && (
          <Empty>
            No goals match that name.
            <button className="il-text-button" onClick={() => setQuery("")}>
              Clear search
            </button>
          </Empty>
        )}
      </div>
      <div className="il-index-bottom">
        <span>{matching.length} goals in this index</span>
        <span>Choose one to open →</span>
      </div>
    </section>
  );
}
