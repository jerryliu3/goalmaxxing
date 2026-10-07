"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { BLANK, finishVars, PRISM_LIGHT, type Finish } from "./materials";
import { PrismLightStage } from "./light-stage";
import "./prism.css";

export function PrismMedal({
  finish,
  numeral,
  locked = false,
  size = 72,
  goal = false,
  unlocking = false,
}: {
  finish: Finish;
  numeral: string;
  locked?: boolean;
  size?: number;
  goal?: boolean;
  unlocking?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const still = Boolean(useReducedMotion());
  const previousLocked = useRef(locked);
  const [struck, setStruck] = useState(false);
  useEffect(() => {
    const newlyEarned = previousLocked.current && !locked;
    previousLocked.current = locked;
    if (!newlyEarned || still) return;
    setStruck(true);
    const timer = window.setTimeout(() => setStruck(false), 1500);
    return () => window.clearTimeout(timer);
  }, [locked, still]);

  const material = locked ? BLANK : finish;
  const compact = size < 56;
  const hero = size >= 120;
  const animateUnlock = !still && !locked && (struck || unlocking);
  const mark = (
    <span
      className="prism-medal"
      aria-hidden="true"
      data-goal={goal || undefined}
      data-detail={hero ? "hero" : compact ? "small" : "shelf"}
      data-locked={locked || undefined}
      data-unlocking={animateUnlock || undefined}
      data-face={material.face}
      data-material={material.key}
      style={{
        width: size,
        height: size,
        ...finishVars(material),
        "--prism-white": PRISM_LIGHT.white,
        "--prism-black": PRISM_LIGHT.black,
      } as CSSProperties}
    >
      <span className="prism-body">
        <span className="prism-rim" />
        <span className="prism-face">
          {material.face === "gem" && !compact && !locked ? <span className="prism-facets" /> : null}
        </span>
        <svg className="prism-letter" width={size} height={size} viewBox="0 0 120 120">
          <defs>
            <linearGradient id={`prism-ink-${id}`} x1="0" y1="0" x2="1" y2="1">
              {material.ink.map((color, index) => <stop key={index} offset={index / 2} stopColor={color} />)}
            </linearGradient>
          </defs>
          <text
            x="60"
            y={goal ? 74 : 77}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontWeight={compact ? 600 : 400}
            fontSize={goal ? 40 : 48}
            letterSpacing="-2"
            fill={locked ? "none" : `url(#prism-ink-${id})`}
            stroke={locked ? material.type : undefined}
            strokeWidth={locked ? 0.8 : undefined}
          >
            {numeral}
          </text>
        </svg>
        {hero && !locked ? <span className="prism-glint" /> : null}
        {animateUnlock ? <><span className="prism-sweep" /><span className="prism-catch" /></> : null}
      </span>
    </span>
  );
  return hero ? <PrismLightStage className="inline-block">{mark}</PrismLightStage> : mark;
}
