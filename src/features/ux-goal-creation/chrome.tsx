"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { type ReactNode, useState } from "react";
import { GOAL_CREATION_CONCEPTS, type GoalCreationConcept } from "./model";
import "./creation.css";

/**
 * Lab chrome for one concept: back to the index, A/B/C switcher, the bet in one line,
 * and a restart that remounts the flow (every draft is local state).
 */
export function CreationChrome({ concept, children }: { concept: GoalCreationConcept; children: (restart: () => void) => ReactNode }) {
  const [run, setRun] = useState(0);
  const restart = () => setRun((value) => value + 1);
  return (
    <div className="gc-study">
      <header className="gc-lab-header">
        <Link href="/ux/goal-creation" className="gc-lab-back">
          <ArrowLeft aria-hidden className="size-4" />
          Goal creation
        </Link>
        <p className="gc-lab-title">
          {concept.letter} / {concept.name}
        </p>
        <nav aria-label="Creation concepts">
          {GOAL_CREATION_CONCEPTS.map((item) => (
            <Link
              key={item.slug}
              href={`/ux/goal-creation/${item.slug}`}
              aria-current={item.slug === concept.slug ? "page" : undefined}
              aria-label={`${item.letter} ${item.name}`}
            >
              {item.letter}
            </Link>
          ))}
        </nav>
      </header>
      <div className="gc-pitch">
        <p>{concept.thesis}</p>
        <span>Study · nothing is saved</span>
        <button type="button" className="card-button" onClick={restart}>
          <RotateCcw size={14} aria-hidden="true" /> Start over
        </button>
      </div>
      <main className="gc-main" key={run}>
        {children(restart)}
      </main>
      <ConceptNote concept={concept} />
    </div>
  );
}

function ConceptNote({ concept }: { concept: GoalCreationConcept }) {
  return (
    <section className="gc-note-section" aria-label="About this concept">
      <dl>
        <div>
          <dt>Moments</dt>
          <dd>{concept.moments.join(" → ")}</dd>
        </div>
        <div>
          <dt>Reward</dt>
          <dd>{concept.reward}</dd>
        </div>
        <div>
          <dt>Locked</dt>
          <dd>{concept.locked}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{concept.risk}</dd>
        </div>
      </dl>
    </section>
  );
}
