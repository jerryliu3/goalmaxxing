"use client";

import { Lock, Pencil } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BackStyle } from "./card-back";
import { CardStage, FACE_LABELS, FaceControls, faceValue, goalColorStyle, isChanged, regionStyle } from "./card-stage";
import { InlineFact } from "./inline-fact";
import { useCardRegions, type FaceFact } from "./use-card-regions";
import type { EditSession } from "./use-edit-session";

// Facts printed at the card's left edge call out left; full-width and right-edge facts call
// out right, so no leader line crosses the face.
const LEFT: FaceFact[] = ["visibility", "category", "start", "time"];
const RIGHT: FaceFact[] = ["cadence", "name", "stretch", "deadline"];
const GAP = 8;

interface Line {
  fact: FaceFact;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Facts become callouts beside the card, each level with where it prints. Callouts
 * stack without overlapping; an opening editor pushes its neighbours as it grows, and
 * the leader lines are drawn from the same computed positions so they never lag.
 */
export function AnnotatedCard({ session, backStyle }: { session: EditSession; backStyle: BackStyle }) {
  const [open, setOpen] = useState<FaceFact | null>(null);
  const [hover, setHover] = useState<FaceFact | null>(null);
  const [back, setBack] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const columns = useRef<{ left: HTMLDivElement | null; right: HTMLDivElement | null }>({ left: null, right: null });
  const callouts = useRef(new Map<FaceFact, HTMLDivElement>());
  const { regions } = useCardRegions(stageRef, JSON.stringify(session.fields));
  const [layout, setLayout] = useState<{ tops: Partial<Record<FaceFact, number>>; height: number; lines: Line[] } | null>(null);
  const regionsRef = useRef(regions);

  /** Stack each side's callouts level with their facts and derive the leader lines. */
  const relayout = useCallback(() => {
    const regions = regionsRef.current;
    const board = boardRef.current?.getBoundingClientRect();
    const stage = stageRef.current?.getBoundingClientRect();
    const left = columns.current.left?.getBoundingClientRect();
    const right = columns.current.right?.getBoundingClientRect();
    if (!board || !stage || !left || !right || regions.length === 0) return;
    const offsetY = stage.top - board.top;
    const offsetX = stage.left - board.left;
    const tops: Partial<Record<FaceFact, number>> = {};
    const lines: Line[] = [];
    let height = 0;
    for (const [side, facts] of [["left", LEFT], ["right", RIGHT]] as const) {
      let cursor = 0;
      const ordered = facts
        .map((fact) => regions.find((region) => region.fact === fact))
        .filter((region) => region !== undefined)
        .sort((a, b) => a.y - b.y);
      for (const region of ordered) {
        const node = callouts.current.get(region.fact);
        const anchor = node?.querySelector<HTMLElement>("[data-anchor]");
        const anchorY = anchor ? anchor.offsetTop + anchor.offsetHeight / 2 : 30;
        const target = offsetY + region.y + region.height / 2;
        const top = Math.max(target - anchorY, cursor);
        tops[region.fact] = top;
        cursor = top + (node?.offsetHeight ?? 56) + GAP;
        lines.push({
          fact: region.fact,
          x1: side === "left" ? left.right - board.left : right.left - board.left,
          y1: top + anchorY,
          x2: offsetX + (side === "left" ? region.x - 4 : region.x + region.width + 4),
          y2: target,
        });
      }
      height = Math.max(height, cursor);
    }
    setLayout({ tops, height, lines });
  }, []);

  // Facts moved (card re-rendered) or a callout opened: lay out now, then follow the
  // editor's reveal frame by frame so neighbours are pushed as it grows.
  useLayoutEffect(() => {
    regionsRef.current = regions;
    relayout();
    let frame = 0;
    const until = performance.now() + 400;
    const follow = () => {
      relayout();
      if (performance.now() < until) frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [regions, open, relayout]);

  // Editors also change height while in use (chips wrapping, milestone lists).
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => relayout());
    callouts.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [open, relayout]);

  const close = useCallback(() => setOpen(null), []);
  // A press anywhere but the open callout (or its fact on the card) closes it.
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!callouts.current.get(open)?.contains(target) && !target.closest(`[data-spot="${open}"]`)) setOpen(null);
    };
    window.addEventListener("pointerdown", dismiss);
    return () => window.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const highlighted = open ?? hover;
  const callout = (fact: FaceFact) => (
    <div
      key={fact}
      ref={(node) => {
        if (node) callouts.current.set(fact, node);
        else callouts.current.delete(fact);
      }}
      className="ie-callout"
      data-callout={fact}
      data-open={open === fact}
      data-hover={highlighted === fact}
      data-changed={isChanged(fact, session)}
      data-locked={fact === "start"}
      style={{ top: layout?.tops[fact] ?? 0 }}
      onMouseEnter={() => setHover(fact)}
      onMouseLeave={() => setHover(null)}
    >
      {open === fact && fact !== "start" ? (
        <div className="ie-callout-edit">
          <span className="ie-overline">{FACE_LABELS[fact]}</span>
          <span className="ie-callout-control" data-anchor>
            <InlineFact fact={fact} session={session} onDone={close} />
          </span>
        </div>
      ) : (
        <button type="button" disabled={fact === "start"} aria-expanded={false} onClick={() => setOpen(fact)}>
          <span className="ie-overline">{FACE_LABELS[fact]}</span>
          <span className="ie-callout-value" data-anchor>
            {faceValue(fact, session)}
            {fact === "start" ? <Lock size={11} aria-label="Fixed" /> : <Pencil size={11} aria-hidden="true" />}
          </span>
        </button>
      )}
    </div>
  );

  const overlay = (
    <div className="ie-face-overlay" data-design="annotated">
      {regions.filter((region) => region.fact !== "start").map((region) => (
        <button
          key={region.fact}
          type="button"
          className="ie-spot"
          data-spot={region.fact}
          data-active={highlighted === region.fact}
          style={regionStyle(region)}
          aria-label={`Edit ${FACE_LABELS[region.fact].toLowerCase()}`}
          onMouseEnter={() => setHover(region.fact)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setOpen(open === region.fact ? null : region.fact)}
        >
          {!region.present && <span className="ie-ghost">+ {FACE_LABELS[region.fact].toLowerCase()}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="ie-cardface" data-design="annotated" style={goalColorStyle(session)}>
      <div
        ref={boardRef}
        className="ie-annotated"
        data-back={back}
        data-ready={layout !== null}
        onKeyDown={(event) => event.key === "Escape" && setOpen(null)}
      >
        <div ref={(node) => { columns.current.left = node; }} className="ie-callouts" data-side="left" style={{ height: layout?.height }}>
          {LEFT.map(callout)}
        </div>
        <CardStage session={session} stageRef={stageRef} overlay={overlay} back={back} backStyle={backStyle} onFlipBack={() => setBack(false)} />
        <div ref={(node) => { columns.current.right = node; }} className="ie-callouts" data-side="right" style={{ height: layout?.height }}>
          {RIGHT.map(callout)}
        </div>
        <svg className="ie-leaders" aria-hidden="true">
          {layout?.lines.map((line) => {
            const bend = (line.x1 + line.x2) / 2;
            return (
              <g key={line.fact} data-active={highlighted === line.fact} data-changed={isChanged(line.fact, session)}>
                <path d={`M ${line.x1} ${line.y1} C ${bend} ${line.y1}, ${bend} ${line.y2}, ${line.x2} ${line.y2}`} />
                <circle cx={line.x2} cy={line.y2} r={2.5} />
              </g>
            );
          })}
        </svg>
      </div>
      <FaceControls session={session} back={back} onFlip={() => { setOpen(null); setBack(!back); }} />
    </div>
  );
}
