"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import { RewardCardFace } from "./reward-card-face";
import { getRewardProgress } from "./reward-model";
import { buildRewardPieces } from "./reward-pieces";
import styles from "./reassembling-card.module.css";

export function ReassemblingCard({ fields, completed, target, still }: {
  fields: GoalCreationFields;
  completed: number;
  target: number;
  still: boolean;
}) {
  const progress = getRewardProgress(completed, target);
  const pieces = useMemo(() => buildRewardPieces(progress.required), [progress.required]);
  const [landed, setLanded] = useState(progress.earned);
  const fused = progress.earned && (still || landed);
  useEffect(() => {
    if (!progress.earned) setLanded(false);
    else if (still) setLanded(true);
  }, [progress.earned, still]);

  return (
    <div className={styles.surface} data-reassembly="" data-fused={fused} data-still={still}>
      {/* One canonical, accessible card also sizes every clipped copy exactly. */}
      <div className={styles.fused} data-visible={fused}>
        <RewardCardFace fields={fields} earned={progress.earned} />
      </div>
      {!fused && <>
        <div className={styles.ghost} data-ghost="" aria-hidden="true">
          <RewardCardFace fields={fields} earned={false} solid={false} />
          <svg className={styles.outlines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {pieces.map(piece => <polygon key={piece.id} points={piece.points.map(point => `${point.x},${point.y}`).join(" ")} />)}
          </svg>
        </div>
        {pieces.filter(piece => piece.earnedAt <= progress.credited).map(piece => (
          <div key={piece.id} className={styles.piece} data-reward-piece={piece.id} data-earned-at={piece.earnedAt} aria-hidden="true"
            style={{
              "--throw-x": `${piece.throwX}px`, "--throw-y": `${piece.throwY}px`, "--throw-turn": `${piece.turn}deg`,
              "--arrival-delay": `${Math.min(piece.id * 20, 260)}ms`,
            } as CSSProperties}
            onAnimationEnd={event => {
              if (event.target === event.currentTarget && progress.earned && piece.id === pieces.length - 1) setLanded(true);
            }}
          >
            <div className={styles.pieceFace} style={{ clipPath: piece.clipPath }}>
              <RewardCardFace fields={fields} earned={progress.earned} solid={false} />
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}
