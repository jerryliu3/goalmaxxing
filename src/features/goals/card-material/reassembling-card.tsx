"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CardSolidBody } from "./card-solid-body";
import { getRewardProgress } from "./reassembly-progress";
import { buildRewardPieces, fragmentMaskImage, pieceScatter } from "./reward-pieces";
import styles from "./reassembling-card.module.css";

type PreviewPhase = "whole" | "etched" | "released" | "ghost";

/** Matches the plaque-motion review study: whole → etch → release → empty map. */
const PREVIEW_BEATS = { whole: 320, etched: 480, released: 850 } as const;

/** One accessible face, clipped visual copies, and a seamless solid on completion. */
export function ReassemblingCard({ children, completed, target, still, preview, flat }: {
  children: ReactNode;
  completed: number;
  target: number;
  still: boolean;
  preview?: boolean;
  /** Gallery grids paint shards as one 2D mask instead of extruded copies. */
  flat?: boolean;
}) {
  const { required, credited, earned } = getRewardProgress(completed, target);
  const pieces = useMemo(() => buildRewardPieces(required), [required]);
  const quiet = still || Boolean(flat);
  const [arrival, setArrival] = useState({ observed: credited, settled: credited });
  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>(
    !preview || quiet ? "ghost" : "whole",
  );
  useEffect(() => {
    if (!preview) return;
    if (quiet) {
      setPreviewPhase("ghost");
      return;
    }
    setPreviewPhase("whole");
    const etchedAt = window.setTimeout(
      () => setPreviewPhase("etched"),
      PREVIEW_BEATS.whole,
    );
    const releasedAt = window.setTimeout(
      () => setPreviewPhase("released"),
      PREVIEW_BEATS.whole + PREVIEW_BEATS.etched,
    );
    const ghostAt = window.setTimeout(
      () => setPreviewPhase("ghost"),
      PREVIEW_BEATS.whole + PREVIEW_BEATS.etched + PREVIEW_BEATS.released,
    );
    return () => {
      window.clearTimeout(etchedAt);
      window.clearTimeout(releasedAt);
      window.clearTimeout(ghostAt);
    };
  }, [preview, quiet]);
  if (arrival.observed !== credited || (quiet && arrival.settled !== credited)) {
    setArrival({ observed: credited, settled: quiet ? credited : Math.min(arrival.settled, credited) });
  }
  const fused = earned && (quiet || arrival.settled >= required);
  const showPreviewWhole = Boolean(preview && !fused && previewPhase === "whole");
  const showPreviewShards = Boolean(
    preview && !fused && (previewPhase === "etched" || previewPhase === "released"),
  );
  const shownPieces = preview
    ? showPreviewShards ? pieces : []
    : pieces.filter(piece => piece.earnedAt <= credited);
  useEffect(() => {
    if (quiet || arrival.settled >= credited) return;
    // Also finish if animation events are interrupted.
    const timer = window.setTimeout(() => setArrival({ observed: credited, settled: credited }), 1200);
    return () => window.clearTimeout(timer);
  }, [credited, quiet, arrival.settled]);
  const flatMask = flat && !fused
    ? fragmentMaskImage(shownPieces.map((piece) => piece.clipPath))
    : null;

  return (
    <div className={styles.surface} data-reassembly="" data-fused={fused} data-still={quiet}
      data-flat={flat || undefined}
      data-preview={preview} data-preview-phase={preview ? previewPhase : undefined}>
      {showPreviewWhole && (
        <div className={styles.previewWhole} data-preview-whole="" aria-hidden="true">
          <CardSolidBody />
          {children}
        </div>
      )}
      <div className={styles.fused} data-visible={fused}>
        {fused && !flat && <CardSolidBody />}
        {children}
      </div>
      {!fused && <>
        <div className={styles.ghost} data-ghost="" aria-hidden="true">
          {children}
          <svg className={styles.outlines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {pieces.map(piece => <polygon key={piece.id} points={piece.points.map(point => `${point.x},${point.y}`).join(" ")} />)}
          </svg>
        </div>
        {flat && flatMask ? (
          <div
            className={styles.flatEarned}
            data-flat-earned=""
            aria-hidden="true"
            style={{ maskImage: flatMask, WebkitMaskImage: flatMask } as CSSProperties}
          >
            {children}
          </div>
        ) : shownPieces.map(piece => (
          <Piece
            key={piece.id}
            piece={piece}
            arriving={!preview && !quiet && piece.earnedAt > arrival.settled}
            preview={Boolean(preview)}
            onSettled={() => setArrival(current => ({
              ...current,
              settled: Math.max(current.settled, piece.earnedAt),
            }))}
          >
            {/* Each fragment keeps the same extruded body as the finished card so a
                tilt shows thickness on the shards, not only after fusion. */}
            <CardSolidBody />
            {children}
          </Piece>
        ))}
      </>}
    </div>
  );
}

function Piece({
  piece,
  arriving,
  preview,
  children,
  onSettled,
}: {
  piece: ReturnType<typeof buildRewardPieces>[number];
  arriving: boolean;
  preview: boolean;
  children: ReactNode;
  onSettled: () => void;
}) {
  const scatter = pieceScatter(piece);

  return (
    <div
      className={styles.piece}
      data-reward-piece={piece.id}
      data-earned-at={piece.earnedAt}
      data-arriving={arriving}
      aria-hidden="true"
      style={{
        "--throw-x": `${piece.throwX}px`,
        "--throw-y": `${piece.throwY}px`,
        "--throw-turn": `${piece.turn}deg`,
        "--arrival-delay": `${Math.min(piece.id * 20, 260)}ms`,
        "--scatter-x": `${scatter.x}px`,
        "--scatter-y": `${scatter.y}px`,
        "--scatter-turn": `${piece.turn / 8}deg`,
        "--delay": `${piece.id * 10}ms`,
      } as CSSProperties}
      onAnimationEnd={event => {
        if (!preview && event.target === event.currentTarget) onSettled();
      }}
    >
      <div className={styles.pieceFace} style={{ clipPath: piece.clipPath }}>
        {children}
      </div>
    </div>
  );
}
