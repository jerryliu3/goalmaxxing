import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { goalLabel, dateLabel } from "./model";
import { ItemRow, Empty } from "./primitives";
import { GoalIndex } from "./goal-index";
import type { Lab } from "./use-lab";

export function GoalLibrary({ s }: { s: Lab }) {
  const [detail, setDetail] = useState(false);
  const goals = s.goals;
  const active = goals.find((g) => g.id === s.activeGoal) || goals[0];
  const records = s.data.records.filter((r) => r.goalId === active?.id);
  return (
    <div className={`il-library ${detail ? "show-detail" : ""}`}>
      <GoalIndex
        goals={goals}
        activeId={active?.id || null}
        onCreate={() => s.setCreating(true)}
        onSelect={(id) => {
          s.setActiveGoal(id);
          setDetail(true);
        }}
      />
      {active && (
        <section className="il-goal-detail">
          <button
            className="il-library-back il-text-button"
            onClick={() => setDetail(false)}
          >
            ← Back to goals
          </button>
          <span className="il-eyebrow">
            {active.category} /{" "}
            {active.is_private ? "Private" : "Visible to your people"}
          </span>
          <h2>{active.title}</h2>
          <p>
            {goalLabel(active)} · since {dateLabel(active.start_date)}
          </p>
          <div className="il-goal-evidence">
            <strong>{records.length}</strong>
            <span>
              recorded completions
              <small>All sample history · counts, not time</small>
            </span>
          </div>
          {active.milestone_names && (
            <ol className="il-milestones">
              {active.milestone_names.map((name) => (
                <li key={name}>
                  <span>
                    {records.some((r) => r.title === name) ? (
                      <Check size={14} />
                    ) : (
                      "○"
                    )}
                  </span>
                  {name}
                </li>
              ))}
            </ol>
          )}
          <div className="il-section-heading">
            <h3>Next in your plan</h3>
            <button
              className="il-text-button"
              onClick={() => {
                s.setGoalIds([active.id]);
                s.setDestination("progress");
              }}
            >
              See history <ArrowUpRight size={15} />
            </button>
          </div>
          {s.data.items
            .filter(
              (i) => i.goalId === active.id && (!i.date || i.date >= s.date),
            )
            .slice(0, 5)
            .map((item) => (
              <div key={item.id}>
                <span className="il-eyebrow">
                  {item.date ? dateLabel(item.date) : "Unplanned"}
                </span>
                <ItemRow item={item} s={s} />
              </div>
            ))}
          {!s.data.items.some((i) => i.goalId === active.id) && (
            <Empty>
              No occurrences in this sample. Create a goal to try placing its
              first occurrence.
            </Empty>
          )}
          <details className="il-goal-settings">
            <summary>Goal details</summary>
            <dl>
              <dt>Target</dt>
              <dd>{goalLabel(active)}</dd>
              <dt>End date</dt>
              <dd>
                {active.end_date ? dateLabel(active.end_date) : "No end date"}
              </dd>
              <dt>Team</dt>
              <dd>{active.team || "Personal"}</dd>
              <dt>Reward</dt>
              <dd>{active.reward_text || "None"}</dd>
              <dt>Linked goal</dt>
              <dd>
                {s.data.goals.find((g) => g.id === active.linkedTo)?.title ||
                  "None"}
              </dd>
            </dl>
          </details>
        </section>
      )}
    </div>
  );
}
