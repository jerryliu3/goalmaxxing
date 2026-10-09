"use client";
import { useState } from "react";
import { GoalProgressCard } from "@/features/goals/goal-progress-card";
import { goalCardProgress } from "@/features/goals/goal-card-progress";
import { GOALS, GOAL_PROGRESS } from "@/features/ux-profile/seed";
import { Search } from "@/features/ux-refresh/primitives";
import { Action, ProductHeader } from "./common";
import { CreationNavigation } from "./creation-navigation";

const ENTRIES = GOALS.flatMap((goal) => {
  const progress = GOAL_PROGRESS.find((item) => item.goalId === goal.id);
  return progress &&
    progress.lifecycle !== "ended" &&
    progress.outcome !== "achieved"
    ? [{ goal, progress }]
    : [];
});
export function ProfileGoals() {
  return (
    <section className="fc-section">
      <h3 className="type-heading">Current goals</h3>
      <div className="fc-collection-grid mt-5">
        {ENTRIES.slice(0, 2).map(({ goal, progress }) => (
          <GoalProgressCard
            key={goal.id}
            goal={goal}
            progress={progress}
            gallery
          />
        ))}
      </div>
    </section>
  );
}
export function CollectionBaseline() {
  return (
    <div className="fc-product">
      <ProductHeader title="Current goals" detail="Goals / Your collection" />
      <div className="fc-collection-grid">
        {ENTRIES.map(({ goal, progress }) => (
          <GoalProgressCard
            key={goal.id}
            goal={goal}
            progress={progress}
            gallery
          />
        ))}
      </div>
    </div>
  );
}
export function CollectionStudy() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Name");
  const visible = ENTRIES.filter(({ goal }) =>
    `${goal.title} ${goal.category}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  ).sort((a, b) =>
    sort === "Name"
      ? a.goal.title.localeCompare(b.goal.title)
      : b.progress.percent - a.progress.percent,
  );
  return (
    <div className="fc-product">
      <ProductHeader title="Current goals" detail="Goals / Your collection" />
      <div className="fc-collection-tools">
        <Search
          value={query}
          onChange={setQuery}
          label="Search your current goals"
        />
        <label className="rf-field">
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Name</option>
            <option>Progress</option>
          </select>
        </label>
      </div>
      <p role="status" className="fc-muted mb-6">
        {visible.length} of {ENTRIES.length} goals
      </p>
      <div className="fc-collection-grid">
        {visible.map(({ goal, progress }) => (
          <article key={goal.id} aria-label={goal.title}>
            <div className="fc-card-name">
              <h3 className="type-item">{goal.title}</h3>
              <p className="fc-muted">
                {goal.category} · {goalCardProgress(goal, progress).label}
              </p>
            </div>
            <GoalProgressCard goal={goal} progress={progress} gallery />
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="fc-empty">
          <h3 className="type-heading">No matching goals</h3>
          <p>Try a different name or category.</p>
          <Action variant="outline" onClick={() => setQuery("")}>
            Clear search
          </Action>
        </div>
      )}
      <CreationNavigation />
    </div>
  );
}
