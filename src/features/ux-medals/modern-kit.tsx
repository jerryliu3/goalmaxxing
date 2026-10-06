import type { CSSProperties, ReactNode } from "react";
import { T } from "@/features/ux-medals/mark-kit";
import { detailForSize, useSvgId } from "@/features/ux-medals/svg-geometry";

/**
 * Shared pieces for the Round 2 systems. Everything here is lifted from the
 * goal card's anatomy: its face colour and ink, the light tight numeral, mono
 * small caps, and the stepped effort bars.
 */

/** The plain TempoGoalCard face and ink. Physical systems keep these in both themes. */
export const CARD = { face: "#fff7de", ink: "#20251e" } as const;

/** Card face tinted by the hero colour — the same mix the card uses for its category. */
export const tint = (accent: string, pct = 24) => `color-mix(in srgb, ${accent} ${pct}%, ${CARD.face})`;

/** A deeper accent for rules, bars, and numeral shadows on a tinted face. */
export const deepen = (accent: string, pct = 72) => `color-mix(in srgb, ${accent} ${pct}%, ${CARD.ink})`;

export const PENCIL = "var(--md-pencil)";

type Anchor = "start" | "middle" | "end";

/**
 * The card's big number: light weight, tight tracking, tabular figures.
 * `emboss` adds the solid-lettering lift; `outline` draws it as a die line.
 */
export function Numeral({
  x,
  y,
  size,
  value,
  anchor = "start",
  weight = 400,
  fill = CARD.ink,
  emboss,
  outline,
  className,
}: {
  x: number;
  y: number;
  size: number;
  value: string;
  anchor?: Anchor;
  weight?: number;
  fill?: string;
  emboss?: string;
  outline?: string;
  className?: string;
}) {
  const props = {
    x,
    y,
    fontSize: size,
    fontWeight: weight,
    textAnchor: anchor,
    letterSpacing: -size * 0.06,
    className: T.sans,
  };
  const figures: CSSProperties = { fontVariantNumeric: "tabular-nums" };
  if (outline) {
    return (
      <text
        {...props}
        className={`${T.sans} ${className ?? ""}`}
        fill="none"
        strokeWidth={Math.max(0.55, size / 70)}
        strokeLinejoin="round"
        style={{ ...figures, stroke: outline }}
      >
        {value}
      </text>
    );
  }
  return (
    <g className={className}>
      {emboss ? (
        <>
          <text {...props} transform="translate(0.7 0.9)" opacity={0.32} style={{ ...figures, fill: emboss }}>
            {value}
          </text>
          <text {...props} transform="translate(-0.45 -0.5)" opacity={0.7} fill="#fff" style={figures}>
            {value}
          </text>
        </>
      ) : null}
      <text {...props} style={{ ...figures, fill }}>
        {value}
      </text>
    </g>
  );
}

/** Mono small caps: overlines, fixed-corner dates, labels. */
export function Caption({
  x,
  y,
  children,
  size = 5.4,
  anchor = "start",
  fill = CARD.ink,
  opacity = 0.72,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  anchor?: Anchor;
  fill?: string;
  opacity?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={500}
      letterSpacing={size * 0.14}
      textAnchor={anchor}
      className={T.mono}
      opacity={opacity}
      style={{ fill }}
    >
      {children}
    </text>
  );
}

/** Stacked text lines (titles in sans, rewards in italic display). */
export function Lines({
  x,
  y,
  lines,
  size,
  gap = 1.18,
  anchor = "start",
  fill = CARD.ink,
  weight = 500,
  italic = false,
}: {
  x: number;
  y: number;
  lines: readonly string[];
  size: number;
  gap?: number;
  anchor?: Anchor;
  fill?: string;
  weight?: number;
  italic?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      letterSpacing={italic ? 0 : -size * 0.02}
      textAnchor={anchor}
      className={italic ? `${T.display} md-t-italic` : T.sans}
      style={{ fill }}
    >
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : size * gap}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** The card's effort bars, reused as a rank meter: `active` of `count` steps lit. */
export function Steps({
  right,
  base,
  count,
  active,
  fill,
  idle = `color-mix(in srgb, ${CARD.ink} 14%, transparent)`,
  outline,
  width = 2.6,
  gap = 1.5,
  k = 1,
}: {
  right: number;
  base: number;
  count: number;
  active: number;
  fill: string;
  idle?: string;
  outline?: string;
  width?: number;
  gap?: number;
  /** Height scale, so shelf sizes can carry taller bars. */
  k?: number;
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const height = (3 + i * 1.6) * k;
        const x = right - (count - i) * (width + gap) + gap;
        const on = i < active;
        return (
          <rect
            key={i}
            x={x}
            y={base - height}
            width={width}
            height={height}
            rx={width * 0.4}
            style={
              outline
                ? { fill: "none", stroke: outline, strokeWidth: 0.5 }
                : { fill: on ? fill : idle }
            }
          />
        );
      })}
    </g>
  );
}

/** A plain check, drawn on a 10-unit grid. */
export function Tick({ x, y, size, stroke, width }: { x: number; y: number; size: number; stroke: string; width: number }) {
  const s = size / 10;
  return (
    <path
      d="M -4 0.2 L -1.2 3 L 4.2 -2.8"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill="none"
      strokeWidth={width / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ stroke }}
    />
  );
}

/** The card's soft resting shadow, for physical systems on the page. */
export function RestShadow({ id }: { id: string }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="2.2" stdDeviation="2.6" floodColor="#172015" floodOpacity="0.14" />
    </filter>
  );
}

/** Per-render facts every physical mark needs: level of detail, lock state, accent, ink. */
export interface Face {
  id: string;
  hero: boolean;
  tiny: boolean;
  locked: boolean;
  accent: string;
  ink: string;
  unlocking: boolean;
}

export function useFace(accent: string, size: number, locked: boolean, unlocking: boolean): Face {
  const detail = detailForSize(size);
  return {
    id: useSvgId("md"),
    hero: detail === "hero",
    tiny: detail === "tiny",
    locked,
    accent,
    ink: locked ? PENCIL : CARD.ink,
    unlocking,
  };
}

/** Numeral on a physical face: embossed when earned, a die line when locked, paper on solid tiny faces. */
export function Figure({
  face,
  x,
  y,
  size,
  value,
  anchor,
  className,
}: {
  face: Face;
  x: number;
  y: number;
  size: number;
  value: string;
  anchor?: Anchor;
  className?: string;
}) {
  if (face.tiny) {
    // Inline sizes drop the card's leading zero: "4", not "04".
    const short = value.replace(/^0(?=\d)/, "");
    return <Numeral x={x} y={y} size={size} value={short} anchor={anchor} weight={600} fill={face.locked ? PENCIL : CARD.face} />;
  }
  return face.locked ? (
    <Numeral x={x} y={y} size={size} value={value} anchor={anchor} outline={PENCIL} className={className} />
  ) : (
    <Numeral x={x} y={y} size={size} value={value} anchor={anchor} emboss={deepen(face.accent)} className={className} />
  );
}
