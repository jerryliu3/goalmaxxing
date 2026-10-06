"use client";

import { Lock, Pencil } from "lucide-react";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type { CardEditorSession } from "./card-editor-session";
import { CARD_FACT_LABELS, type FaceFact, summarizeFaceFact } from "./card-facts";
import { CardScene } from "./card-scene";
import { InlineFact, useEscapeLayer } from "./inline-fact";
import { boxWithin, useCardRegions } from "./use-card-regions";
import "./card-editor.css";

// Facts printed at the card's left edge call out left (the target sits beside its number);
// the title, effort and right-edge facts call out right, so no leader line crosses the face.
const LEFT: FaceFact[] = ["visibility", "cadence", "category", "start", "time"];
const RIGHT: FaceFact[] = ["name", "difficulty", "deadline"];
const GAP = 8;

interface Line {
  fact: FaceFact;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * The card with each printed fact called out beside it, level with where it prints and
 * joined by a leader line. With a `session`, a callout edits its fact in place; without
 * one it is a read-only legend (the creation review).
 */
export function AnnotatedCard({
  fields,
  card,
  session,
  back,
  flipped = false,
  labels,
  hidden = [],
  labelsOnly = false,
}: {
  fields: GoalCreationFields;
  card: ReactNode;
  session?: CardEditorSession;
  back?: ReactNode;
  flipped?: boolean;
  labels?: Partial<Record<FaceFact, string>>;
  hidden?: FaceFact[];
  /** Read-only legend: each callout names the part; the card already shows its value. */
  labelsOnly?: boolean;
}) {
  const [open, setOpen] = useState<FaceFact | null>(null);
  const [hover, setHover] = useState<FaceFact | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const columns = useRef<{ left: HTMLDivElement | null; right: HTMLDivElement | null }>({ left: null, right: null });
  const callouts = useRef(new Map<FaceFact, HTMLDivElement>());
  const { regions } = useCardRegions(stageRef, JSON.stringify(fields));
  const regionsRef = useRef(regions);
  const [layout, setLayout] = useState<{ tops: Partial<Record<FaceFact, number>>; height: number; lines: Line[] } | null>(null);
  const editable = Boolean(session);
  const shown = (fact: FaceFact) => !hidden.includes(fact);

  /** Stack each side's callouts level with their facts and derive the leader lines. */
  const relayout = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    // Offsets, not client rects: the flip's rotation must not skew the leader lines.
    const stage = boxWithin(stageRef.current, board);
    const left = boxWithin(columns.current.left, board);
    const right = boxWithin(columns.current.right, board);
    const current = regionsRef.current;
    if (!stage || !left || !right || current.length === 0) return;
    const tops: Partial<Record<FaceFact, number>> = {};
    const lines: Line[] = [];
    let height = 0;
    for (const [side, facts] of [["left", LEFT], ["right", RIGHT]] as const) {
      // Callouts are placed inside their column; lines are drawn in board coordinates.
      const columnTop = side === "left" ? left.y : right.y;
      let cursor = 0;
      const ordered = facts
        .map((fact) => current.find((region) => region.fact === fact && callouts.current.has(fact)))
        .filter((region) => region !== undefined)
        .sort((a, b) => a.y - b.y);
      for (const region of ordered) {
        const node = callouts.current.get(region.fact)!;
        const anchor = node.querySelector<HTMLElement>("[data-anchor]");
        // offsetTop is measured inside the callout's border, so add it back.
        const anchorY = node.clientTop + (anchor ? anchor.offsetTop + anchor.offsetHeight / 2 : 30);
        const target = stage.y + region.y + region.height / 2;
        const top = Math.max(target - columnTop - anchorY, cursor);
        tops[region.fact] = top;
        cursor = top + node.offsetHeight + GAP;
        lines.push({
          fact: region.fact,
          x1: side === "left" ? left.x + left.width : right.x,
          y1: columnTop + top + anchorY,
          x2: stage.x + (side === "left" ? region.x - 4 : region.x + region.width + 4),
          y2: target,
        });
      }
      height = Math.max(height, cursor);
    }
    setLayout({ tops, height, lines });
  }, []);

  // Facts moved or a callout opened: lay out now, then follow the editor frame by frame.
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

  // Editors change height while in use (chips wrapping, a longer title).
  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => relayout());
    callouts.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [open, relayout]);

  const close = useCallback(() => setOpen(null), []);
  useEscapeLayer(open !== null, close);
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
  const label = (fact: FaceFact) => labels?.[fact] ?? CARD_FACT_LABELS[fact];
  const changed = (fact: FaceFact) => Boolean(session?.changed.has(fact));
  const lockedFact = (fact: FaceFact) => fact === "start" || (fact === "visibility" && session ? !session.canChangeVisibility : false);

  const callout = (fact: FaceFact) => {
    const value = summarizeFaceFact(fact, fields);
    const editing = open === fact && session;
    return (
      <div
        key={fact}
        ref={(node) => {
          if (node) callouts.current.set(fact, node);
          else callouts.current.delete(fact);
        }}
        className="card-callout"
        data-callout={fact}
        data-open={Boolean(editing)}
        data-hover={highlighted === fact}
        data-changed={changed(fact)}
        data-static={!editable || lockedFact(fact)}
        style={{ top: layout?.tops[fact] ?? 0 }}
        onMouseEnter={() => setHover(fact)}
        onMouseLeave={() => setHover(null)}
      >
        {editing ? (
          <div className="card-callout-body">
            <span className="card-overline">{label(fact)}</span>
            <span className="card-callout-control" data-anchor>
              <InlineFact fact={fact} session={session} onDone={close} />
            </span>
          </div>
        ) : editable && !lockedFact(fact) ? (
          <button type="button" className="card-callout-body" onClick={() => setOpen(fact)}>
            <span className="card-overline">{label(fact)}</span>
            <span className="card-callout-value" data-anchor>{value}<Pencil size={11} aria-hidden="true" /></span>
          </button>
        ) : labelsOnly ? (
          <div className="card-callout-body">
            <span className="card-callout-name" data-anchor>{label(fact)}</span>
          </div>
        ) : (
          <div className="card-callout-body">
            <span className="card-overline">{label(fact)}</span>
            <span className="card-callout-value" data-anchor>
              {value}
              {editable && <Lock size={11} aria-label="Fixed" />}
            </span>
          </div>
        )}
      </div>
    );
  };

  const overlay = (
    <div className="card-overlay">
      {regions.filter((region) => shown(region.fact) && (!editable || !lockedFact(region.fact))).map((region) =>
        editable ? (
          <button
            key={region.fact}
            type="button"
            className="card-spot"
            data-spot={region.fact}
            data-active={highlighted === region.fact}
            style={{ left: region.x, top: region.y, width: region.width, height: region.height }}
            aria-label={`Edit ${label(region.fact).toLowerCase()}`}
            onMouseEnter={() => setHover(region.fact)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setOpen(open === region.fact ? null : region.fact)}
          >
            {!region.present && <span className="card-ghost">+ {label(region.fact).toLowerCase()}</span>}
          </button>
        ) : (
          <span
            key={region.fact}
            className="card-spot"
            data-active={highlighted === region.fact}
            style={{ left: region.x, top: region.y, width: region.width, height: region.height }}
            onMouseEnter={() => setHover(region.fact)}
            onMouseLeave={() => setHover(null)}
            aria-hidden="true"
          />
        ),
      )}
    </div>
  );

  return (
    <div
      ref={boardRef}
      className="card-annotated"
      data-back={flipped}
      data-ready={layout !== null}
      // The leader lines and callouts sit beside the card scene, so they need the colour too.
      style={{ "--goal-color": fields.color } as CSSProperties}
    >
      <div ref={(node) => { columns.current.left = node; }} className="card-callouts" data-side="left" style={{ height: layout?.height }}>
        {LEFT.filter(shown).map(callout)}
      </div>
      <CardScene
        color={fields.color}
        flipped={flipped}
        back={back}
        front={
          <div ref={stageRef} className="card-stage">
            {card}
            {overlay}
          </div>
        }
      />
      <div ref={(node) => { columns.current.right = node; }} className="card-callouts" data-side="right" style={{ height: layout?.height }}>
        {RIGHT.filter(shown).map(callout)}
      </div>
      <svg className="card-leaders" aria-hidden="true">
        {layout?.lines.map((line) => {
          const bend = (line.x1 + line.x2) / 2;
          return (
            <g key={line.fact} data-active={highlighted === line.fact} data-changed={changed(line.fact)}>
              <path d={`M ${line.x1} ${line.y1} C ${bend} ${line.y1}, ${bend} ${line.y2}, ${line.x2} ${line.y2}`} />
              <circle cx={line.x2} cy={line.y2} r={2.5} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
