import type { CSSProperties, ReactNode } from "react";
import type { AwardTier } from "@/features/achievements/types";
import type { MedalFamily, MedalFamilyKey, MedalRung } from "@/features/ux-medals/model";
import { VIEW } from "@/features/ux-medals/svg-geometry";

export interface LevelMarkProps {
  rung: MedalRung;
  name: string;
  locked?: boolean;
  size?: number;
  /** Adds per-part animation hooks (enamel cells, ink roll) for the unlock moment. */
  unlocking?: boolean;
}

export interface FamilyMarkProps {
  family: MedalFamily;
  size?: number;
}

/** Font roles live in medals.css so SVG text resolves Gazetteer type in every theme. */
export const T = {
  sans: "md-t-sans",
  mono: "md-t-mono",
  display: "md-t-display",
} as const;

/** Each future family borrows a tier ink so the examples read as a set. */
export const FAMILY_TIER: Record<MedalFamilyKey, AwardTier> = {
  challenge: "copper",
  leaderboard: "gold",
  streak: "sage",
  goal: "bronze",
  team: "ink",
};

export function MarkSvg({
  size,
  children,
  className,
  style,
}: {
  size: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      aria-hidden
      focusable="false"
      className={className}
      style={{ overflow: "visible", ...style }}
    >
      {children}
    </svg>
  );
}

/** Stroke glyphs on a 24-unit grid, one per future family. */
const FAMILY_GLYPHS: Record<MedalFamilyKey, string> = {
  challenge: "M6 21 V3 M6 4 H17 L14.5 7.5 L17 11 H6",
  leaderboard: "M2 20 H22 M3 20 V14 H9 V20 M9 20 V9 H15 V20 M15 20 V16 H21 V20 M12 3.5 L12.9 5.4 L15 5.6 L13.4 7 L13.9 9 L12 8 L10.1 9 L10.6 7 L9 5.6 L11.1 5.4 Z",
  streak: "M4 6 H20 V20 H4 Z M4 10 H20 M8 3 V7 M16 3 V7 M8 15 L10.5 17.5 L16 12.5",
  goal: "M2.5 20 L9.5 9 L13.5 15 L16 12 L21.5 20 Z M9.5 9 V3 H14.5 L13 4.8 L14.5 6.6 H9.5",
  team: "M4 12 A5 5 0 1 0 14 12 A5 5 0 1 0 4 12 Z M10 12 A5 5 0 1 0 20 12 A5 5 0 1 0 10 12 Z",
};

export function FamilyGlyph({
  family,
  x,
  y,
  size,
  strokeWidth = 1.6,
}: {
  family: MedalFamilyKey;
  x: number;
  y: number;
  size: number;
  strokeWidth?: number;
}) {
  const scale = size / 24;
  return (
    <path
      d={FAMILY_GLYPHS[family]}
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** Text along a path, centred. */
export function ArcText({
  pathId,
  children,
  size,
  spacing = 1.4,
  className = T.sans,
  weight = 600,
}: {
  pathId: string;
  children: ReactNode;
  size: number;
  spacing?: number;
  className?: string;
  weight?: number;
}) {
  return (
    <text
      className={className}
      fontSize={size}
      fontWeight={weight}
      letterSpacing={spacing}
      fill="currentColor"
      stroke="none"
    >
      <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
        {children}
      </textPath>
    </text>
  );
}

/** Ink edge roughness plus patchy voids where the pad ran dry. */
export function InkFilter({ id, seed, rough }: { id: string; seed: number; rough: number }) {
  return (
    <filter id={id} x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} result="edge" />
      <feDisplacementMap in="SourceGraphic" in2="edge" scale={rough} xChannelSelector="R" yChannelSelector="G" result="rough" />
      <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="3" seed={seed + 11} result="pad" />
      <feColorMatrix in="pad" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.4" result="voids" />
      <feComposite in="rough" in2="voids" operator="in" />
    </filter>
  );
}

export function PencilFilter({ id, seed }: { id: string; seed: number }) {
  return (
    <filter id={id} x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={seed} result="wobble" />
      <feDisplacementMap in="SourceGraphic" in2="wobble" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="drawn" />
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="9" result="grain" />
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.75" result="tooth" />
      <feComposite in="drawn" in2="tooth" operator="in" />
    </filter>
  );
}
