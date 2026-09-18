"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CardSolidBody } from "./card-solid-body";
import { getRewardProgress } from "./reassembly-progress";
import { buildRewardPieces } from "./reward-pieces";
import styles from "./reassembling-card.module.css";

/** One accessible face, clipped visual copies, and a seamless solid on completion. */
export function ReassemblingCard({ children, completed, target, still }: {
  children: ReactNode;
  completed: number;
  target: number;
  still: boolean;
}) {
  const { required, credited, earned } = getRewardProgress(completed, target);
  const pieces = useMemo(() => buildRewardPieces(required), [required]);
  const [arrival, setArrival] = useState({ observed: credited, settled: credited });
  if (arrival.observed !== credited || (still && arrival.settled !== credited)) {
    setArrival({ observed: credited, settled: still ? credited : Math.min(arrival.settled, credited) });
  }
  const fused = earned && (still || arrival.settled >= required);
  useEffect(() => {
    if (still || arrival.settled >= credited) return;
    // Also finish if animation events are interrupted.
    const timer = window.setTimeout(() => setArrival({ observed: credited, settled: credited }), 1200);
    return () => window.clearTimeout(timer);
  }, [credited, still, arrival.settled]);

  return (
    <div className={styles.surface} data-reassembly="" data-fused={fused} data-still={still}>
      <div className={styles.fused} data-visible={fused}>
        {fused && <CardSolidBody />}
        {children}
      </div>
      {!fused && <>
        <div className={styles.ghost} data-ghost="" aria-hidden="true">
          {children}
          <svg className={styles.outlines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {pieces.map(piece => <polygon key={piece.id} points={piece.points.map(point => `${point.x},${point.y}`).join(" ")} />)}
          </svg>
        </div>
        {pieces.filter(piece => piece.earnedAt <= credited).map(piece => (
          <div key={piece.id} className={styles.piece} data-reward-piece={piece.id} data-earned-at={piece.earnedAt}
            data-arriving={!still && piece.earnedAt > arrival.settled} aria-hidden="true"
            style={{ "--throw-x": `${piece.throwX}px`, "--throw-y": `${piece.throwY}px`, "--throw-turn": `${piece.turn}deg`, "--arrival-delay": `${Math.min(piece.id * 20, 260)}ms` } as CSSProperties}
            onAnimationEnd={event => {
              if (event.target === event.currentTarget) setArrival(current => ({ ...current, settled: Math.max(current.settled, piece.earnedAt) }));
            }}
          >
            {/* Each fragment keeps the same extruded body as the finished card so a
                tilt shows thickness on the shards, not only after fusion. */}
            <div className={styles.pieceFace} style={{ clipPath: piece.clipPath }}>
              <CardSolidBody />
              {children}
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}
