"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { Goal } from "@/lib/goals/types";
import { GoalCard, GoalMetadata, GoalPanel } from "./goal-panel";
import type { SessionGrouping, SessionScope } from "./model";
import type { GoalViewStudySession } from "./use-study";

export function MobileDeck({ goals, selectedId, onSelect, study, scope, grouping }: { goals: Goal[]; selectedId: string; onSelect: (id: string) => void; study: GoalViewStudySession; scope: SessionScope; grouping: SessionGrouping }) {
  const rail = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const index = Math.max(0, goals.findIndex(g => g.id === selectedId));
  const selected = goals[index];
  // External selection (filter or arrow) centers its card; native swipes select it.
  useEffect(() => {
    const container = rail.current;
    const card = container?.children[index] as HTMLElement | undefined;
    if (container && card) container.scrollTo({ left: card.offsetLeft - (container.clientWidth - card.clientWidth) / 2, behavior: still ? "instant" : "smooth" });
  }, [index, still, goals]);
  const pendingIndex = useRef(index);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);
  return <div className="gv-mobile-deck">
    <div className="gv-deck-count"><span className="gv-overline">Goal {index + 1} of {goals.length}</span><div><button className="gv-icon-button" aria-label="Previous goal" disabled={index === 0} onClick={() => onSelect(goals[index - 1].id)}><ArrowLeft size={18} /></button><button className="gv-icon-button" aria-label="Next goal" disabled={index === goals.length - 1} onClick={() => onSelect(goals[index + 1].id)}><ArrowRight size={18} /></button></div></div>
    <div ref={rail} className="gv-card-carousel" aria-label="Swipe between goal cards" tabIndex={0} onScroll={() => {
      const container = rail.current;
      if (!container) return;
      const center = container.scrollLeft + container.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      Array.from(container.children).forEach((child, i) => {
        const node = child as HTMLElement;
        const difference = Math.abs(node.offsetLeft + node.clientWidth / 2 - center);
        if (difference < distance) { nearest = i; distance = difference; }
      });
      pendingIndex.current = nearest;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      // Select after momentum settles so programmatic centering cannot fight a swipe.
      scrollTimer.current = setTimeout(() => { const goal = goals[pendingIndex.current]; if (goal && goal.id !== selectedId) onSelect(goal.id); }, 140);
    }}>
      {goals.map(g => <div key={g.id} className="gv-carousel-card" data-selected={g.id === selected.id}><GoalCard goal={g} interactive={false} /></div>)}
    </div>
    <div className="gv-deck-dots" role="group" aria-label="Select goal">{goals.map((g, i) => <button key={g.id} aria-label={`Select ${g.title}`} aria-pressed={i === index} onClick={() => onSelect(g.id)}><span /></button>)}</div>
    <div className="gv-deck-metadata"><GoalMetadata goal={selected} study={study} /></div>
    <GoalPanel key={selected.id} goal={selected} study={study} scope={scope} grouping={grouping} hideCard />
  </div>;
}
