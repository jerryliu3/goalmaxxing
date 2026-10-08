"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  GoalArtifact,
  Heading,
  Notice,
  Search,
} from "../primitives";
import Link from "next/link";
import { Plus } from "lucide-react";
import { INITIAL_LOG, SAMPLE_GOALS, type SampleGoalId } from "../sample";
import { GoalDetails } from "./details";

export function CollectionConcept() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Name");
  const [selected, setSelected] = useState<SampleGoalId | null>(null);
  const [names, setNames] = useState<Record<SampleGoalId, string>>({
    run: SAMPLE_GOALS[0].name,
    language: SAMPLE_GOALS[1].name,
    film: SAMPLE_GOALS[2].name,
  });
  const [message, setMessage] = useState("");
  const progress: Record<SampleGoalId, number> = {
    run: INITIAL_LOG.run.length,
    language: INITIAL_LOG.language.length,
    film: INITIAL_LOG.film.length,
  };
  const goals = SAMPLE_GOALS.filter((goal) =>
    names[goal.id].toLowerCase().includes(query.toLowerCase()),
  ).sort((a, b) =>
    sort === "Name"
      ? names[a.id].localeCompare(names[b.id])
      : progress[b.id] / b.target - progress[a.id] / a.target,
  );
  return (
    <>
      <AppNav active="Goals" />
      <div className="rf-canvas">
        <Heading eyebrow="Current goals" title="A collection of intentions.">
          <Action asChild>
            <Link href="/ux/refresh/goal-creation">
              <Plus aria-hidden size={16} />
              New goal
            </Link>
          </Action>
        </Heading>
        <div className="rf-toolbar">
          <Search value={query} onChange={setQuery} />
          <label className="rf-muted">
            Sort{" "}
            <select
              aria-label="Sort goals"
              className="rf-select ml-2"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option>Name</option>
              <option>Progress</option>
            </select>
          </label>
        </div>
        <div className="rf-art-grid">
          {goals.map((goal) => (
            <div key={goal.id}>
              <GoalArtifact
                id={goal.id}
                nameOverride={names[goal.id]}
                completed={progress[goal.id]}
              />
              <Action
                variant="outline"
                className="w-full"
                onClick={() => setSelected(goal.id)}
              >
                Open {names[goal.id]}
              </Action>
            </div>
          ))}
        </div>
        {!goals.length && (
          <p className="rf-muted">No goals match your search.</p>
        )}
        <div className="mt-6">
          <Notice>{message}</Notice>
        </div>
        {selected && (
          <GoalDetails
            key={selected}
            goalId={selected}
            name={names[selected]}
            onClose={() => setSelected(null)}
            onRename={(name) => {
              setNames({ ...names, [selected]: name });
              setMessage("Sample goal renamed.");
            }}
          />
        )}
      </div>
    </>
  );
}
