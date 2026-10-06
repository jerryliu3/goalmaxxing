import type { CSSProperties, ReactNode } from "react";
import type { Award } from "@/features/ux-medals/awards";
import type { MedalFamily, MedalRung } from "@/features/ux-medals/model";
import { VIEW } from "@/features/ux-medals/svg-geometry";

export interface LevelMarkProps {
  rung: MedalRung;
  name: string;
  locked?: boolean;
  size?: number;
  /** Adds per-part animation hooks for the unlock moment. */
  unlocking?: boolean;
  /** Round 3 hero: the medal turns with the stage pose. Flat systems ignore it. */
  tilt?: boolean;
}

export interface FamilyMarkProps {
  family: MedalFamily;
  size?: number;
  /** The specific award to draw (earned or locked); defaults to the family example. */
  award?: Award;
  unlocking?: boolean;
  tilt?: boolean;
}

/** Font roles live in medals.css so SVG text resolves Gazetteer type in every theme. */
export const T = {
  sans: "md-t-sans",
  mono: "md-t-mono",
  display: "md-t-display",
} as const;

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
