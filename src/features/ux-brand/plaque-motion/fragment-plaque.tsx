"use client";

import { useMemo, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { buildRewardPieces, pieceScatter } from "@/features/goals/card-material/reward-pieces";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import ghostStyles from "@/features/goals/card-material/reassembling-card.module.css";
import type { PlaquePhase } from "./study-model";
import styles from "./plaque-motion.module.css";

/** Study-only choreography around the production material face and partitioner. */
export function FragmentPlaque({ fields, target, phase, still }: {
  fields: GoalCreationFields; target: number; phase: PlaquePhase; still: boolean;
}) {
  const pieces = useMemo(() => buildRewardPieces(target), [target]);
  const whole = phase === "whole" || phase === "fused";
  const fragmented = ["etched", "released", "almost", "gather"].includes(phase);
  const face = <TempoGoalCard fields={fields} rotatable={false} context="history" achieved={phase === "fused"} />;
  return <div className={styles.plaque} data-phase={phase} data-still={still} role="img"
    aria-label={`${fields.title}. ${whole ? "Whole plaque" : `${target} pieces`}.`}>
    <div className={styles.solid} data-visible={whole} aria-hidden="true">{face}</div>
    <div className={`${ghostStyles.ghost} ${styles.ghost}`} data-visible={!whole} aria-hidden="true">
      <TempoGoalCard fields={fields} rotatable={false} assembly={{ completed: 0, target }} />
      <svg className={styles.outlines} viewBox="0 0 100 100" preserveAspectRatio="none">
        <AnimatePresence initial={false}>
          {pieces.map(piece => {
            const points = piece.points.map(point => `${point.x},${point.y}`).join(" ");
            return <motion.polygon key={points} points={points} pathLength={1}
              initial={{ opacity: still ? 1 : 0, pathLength: still ? 1 : 0 }}
              animate={{ opacity: 1, pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0 : 0.3 }} />;
          })}
        </AnimatePresence>
      </svg>
    </div>
    {fragmented && <div className={styles.fragments} aria-hidden="true">
      {pieces.map(piece => {
        const scatter = pieceScatter(piece);
        return <div key={piece.id} className={styles.fragment} data-last={piece.id === pieces.length - 1}
          style={{ "--scatter-x": `${scatter.x}px`, "--scatter-y": `${scatter.y}px`,
            "--turn": `${piece.turn / 8}deg`, "--delay": `${piece.id * 10}ms` } as CSSProperties}>
          <div style={{ clipPath: piece.clipPath }}>{face}</div>
        </div>;
      })}
    </div>}
  </div>;
}
