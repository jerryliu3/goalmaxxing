"use client";

import { useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const rowHeight = 56;

export function TempoMilestoneRope({
  count,
  names,
  onCount,
  onName,
}: {
  count: number;
  names: string[];
  onCount: (value: string) => void;
  onName: (index: number, value: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const helpId = useId();
  const pull = useRef<{ y: number; count: number } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [extension, setExtension] = useState(0);
  // Only mount the names alongside the visible section of a long rope.
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
  const end = Math.min(count, start + 9);
  const setCount = (value: number) =>
    onCount(String(Math.max(1, Math.min(999, value))));

  return (
    <div className="tempo-rope">
      <div className="tempo-rope-heading">
        <strong>{count || "—"}</strong>
        <span>milestones</span>
      </div>
      <div
        ref={viewport}
        className="tempo-rope-viewport"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div
          className="tempo-rope-track"
          style={{ height: Math.max(30, count * rowHeight) }}
        >
          <div className="tempo-rope-line" aria-hidden="true" />
          {Array.from({ length: Math.max(0, end - start) }, (_, offset) => {
            const index = start + offset;
            return (
              <div
                className="tempo-rope-milestone"
                key={index}
                style={{ top: index * rowHeight }}
              >
                <span className="tempo-rope-knot" aria-hidden="true">
                  {index + 1}
                </span>
                <Input
                  aria-label={`Milestone ${index + 1} name`}
                  placeholder={`Milestone ${index + 1} · optional name`}
                  value={names[index] ?? ""}
                  onChange={(event) => onName(index, event.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="tempo-rope-tail" style={{ paddingTop: 16 + extension }}>
        <button
          type="button"
          className="tempo-rope-handle"
          aria-label="Pull to add milestones"
          aria-describedby={helpId}
          data-pulling={pulling}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            pull.current = { y: event.clientY, count };
            setPulling(true);
          }}
          onPointerMove={(event) => {
            if (!pull.current) return;
            const delta = event.clientY - pull.current.y;
            setExtension(Math.max(0, Math.min(48, delta / 3)));
            const distance = Math.abs(delta);
            const amount =
              Math.floor(distance / 28) +
              Math.floor(Math.max(0, distance - 120) / 12);
            const next = Math.max(
              1,
              Math.min(999, pull.current.count + Math.sign(delta) * amount),
            );
            if (amount > 0 && next !== count) {
              setCount(next);
              requestAnimationFrame(() => {
                if (viewport.current)
                  viewport.current.scrollTop = next * rowHeight;
              });
            }
          }}
          onPointerUp={(event) => {
            pull.current = null;
            setPulling(false);
            setExtension(0);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            pull.current = null;
            setPulling(false);
            setExtension(0);
          }}
          onClick={(event) => {
            if (event.detail === 0) setCount(count + 1);
          }}
          onKeyDown={(event) => {
            if (
              ["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(event.key)
            ) {
              event.preventDefault();
              setCount(
                count +
                  (event.key === "ArrowDown"
                    ? 1
                    : event.key === "ArrowUp"
                      ? -1
                      : event.key === "PageDown"
                        ? 10
                        : -10),
              );
            }
          }}
        >
          <span aria-hidden="true">⠿</span>
          <span>Pull down</span>
        </button>
      </div>
      <p className="tempo-hint" id={helpId}>
        Pull the rope to add steps. Pull farther to add faster. Name each
        milestone as it appears.
      </p>
      <label className="tempo-rope-exact">
        Or set an exact count
        <Input
          type="number"
          min="1"
          max="999"
          value={count || ""}
          placeholder="1–999"
          onChange={(event) => {
            const value = event.target.value;
            if (!value) {
              onCount("");
              return;
            }
            const next = Number(value);
            if (Number.isInteger(next) && next > 0 && next <= 999)
              setCount(next);
          }}
        />
      </label>
    </div>
  );
}
