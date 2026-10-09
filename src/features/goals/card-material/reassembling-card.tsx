"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CardSolidBody } from "./card-solid-body";
import { getRewardProgress } from "./reassembly-progress";
import {
  boundingBoxPoints,
  buildRewardPieces,
  insetPolygonPoints,
  pieceScatter,
  type RewardPiece,
} from "./reward-pieces";
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
  useEffect(() => {
    setArrival(current => {
      const next = {
        observed: credited,
        settled: quiet ? credited : Math.min(current.settled, credited),
      };
      return current.observed === next.observed && current.settled === next.settled
        ? current
        : next;
    });
  }, [credited, quiet]);
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

  return (
    <div className={styles.surface} data-reassembly="" data-fused={fused} data-still={quiet}
      data-flat={flat || undefined}
      data-preview={preview} data-preview-phase={preview ? previewPhase : undefined}>
      {showPreviewWhole && (
        <div className={styles.previewWhole} data-preview-whole="" aria-hidden="true">
          {!flat && <CardSolidBody />}
          {children}
        </div>
      )}
      <div className={styles.fused} data-visible={fused}>
        {fused && !flat && <CardSolidBody />}
        {children}
      </div>
      {!fused && <>
        {/* The ghost is the whole empty card: seams belong to earned pieces only. */}
        <div className={styles.ghost} data-ghost="" aria-hidden="true">
          {children}
        </div>
        {flat ? (
          shownPieces.length > 0 ? (
            <FlatShards pieces={shownPieces} total={pieces.length}>
              {children}
            </FlatShards>
          ) : null
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
            {/* Single-card hosts keep the solid body so a tilt still has thickness. */}
            <CardSolidBody />
            {children}
          </Piece>
        ))}
      </>}
    </div>
  );
}

function FlatShards({
  pieces,
  total,
  children,
}: {
  pieces: RewardPiece[];
  total: number;
  children: ReactNode;
}) {
  const clipId = `reward-shards-${useId().replace(/:/g, "")}`;
  return (
    <div className={styles.flatFace} data-flat-shards="" data-piece-count={pieces.length} aria-hidden="true">
      <svg className={styles.flatClip} aria-hidden="true">
        <clipPath id={clipId} clipPathUnits="objectBoundingBox" data-flat-clip="">
          {pieces.map((piece) => (
            <polygon
              key={piece.id}
              points={boundingBoxPoints(insetPolygonPoints(piece.points, total))}
            />
          ))}
        </clipPath>
      </svg>
      <div
        className={styles.flatFaceInner}
        style={{ clipPath: `url(#${clipId})`, WebkitClipPath: `url(#${clipId})` } as CSSProperties}
      >
        {children}
      </div>
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
  const pieceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = pieceRef.current;
    if (!element || preview) return;
    element.addEventListener("animationend", onSettled);
    return () => element.removeEventListener("animationend", onSettled);
  }, [onSettled, preview]);

  return (
    <div
      ref={pieceRef}
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
    >
      <div className={styles.pieceFace} style={{ clipPath: piece.clipPath }}>
        {children}
      </div>
    </div>
  );
}
