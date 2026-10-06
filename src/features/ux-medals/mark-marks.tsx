"use client";

import { awardFor, awardStatus } from "@/features/ux-medals/awards";
import { MarkSvg, T, type FamilyMarkProps, type LevelMarkProps } from "@/features/ux-medals/mark-kit";
import type { FormKey } from "@/features/ux-medals/model";
import { Caption, Numeral, PENCIL } from "@/features/ux-medals/modern-kit";
import { detailForSize, polygonPath, roundedRectPath, useSvgId } from "@/features/ux-medals/svg-geometry";

/*
 * M7 Mark — medals as a small identity system. Solid ink shapes with a paper
 * numeral, a short rule, a mono label. Ink follows the page theme like type
 * does; only goal finishes take colour (their category). Top variants (won,
 * first, anchor) add an outer keyline.
 */

const circle = (r: number) => `M ${60 - r} 60 A ${r} ${r} 0 1 1 ${60 + r} 60 A ${r} ${r} 0 1 1 ${60 - r} 60 Z`;

interface Shape {
  d: string;
  inset: string;
  keyline: string;
  /** Numeral baseline and size at hero / shelf / tiny. */
  hero: [number, number];
  shelf: [number, number];
  tiny: [number, number];
}

const SHAPES: Record<FormKey, Shape> = {
  level: { d: circle(54), inset: circle(49), keyline: circle(59), hero: [66, 40], shelf: [76, 50], tiny: [82, 64] },
  goal: {
    d: roundedRectPath(12, 4, 96, 112, 7),
    inset: roundedRectPath(16.5, 8.5, 87, 103, 4),
    keyline: roundedRectPath(7, -1, 106, 122, 10),
    hero: [60, 38],
    shelf: [72, 48],
    tiny: [80, 56],
  },
  streak: {
    d: roundedRectPath(4, 28, 112, 64, 32),
    inset: roundedRectPath(9, 33, 102, 54, 27),
    keyline: roundedRectPath(-1, 23, 122, 74, 37),
    hero: [71, 32],
    shelf: [78, 44],
    tiny: [83, 58],
  },
  challenge: { d: polygonPath(58, 4), inset: polygonPath(51, 4), keyline: polygonPath(65, 4), hero: [65, 32], shelf: [76, 42], tiny: [82, 56] },
  leaderboard: {
    d: "M 14 10 H 106 V 70 L 60 112 L 14 70 Z",
    inset: "M 19.5 15.5 H 100.5 V 67.5 L 60 104.6 L 19.5 67.5 Z",
    keyline: "M 8 4 H 112 V 72.6 L 60 120 L 8 72.6 Z",
    hero: [60, 38],
    shelf: [70, 50],
    tiny: [76, 62],
  },
  team: { d: polygonPath(57, 6), inset: polygonPath(51, 6), keyline: polygonPath(63, 6), hero: [66, 36], shelf: [76, 46], tiny: [81, 58] },
};

interface MarkFace {
  form: FormKey;
  figure: string;
  label: string;
  /** Second label line for the pill's horizontal lockup. */
  label2?: string;
  ink: string;
  locked: boolean;
  top?: boolean;
  corner?: string;
}

const stripZero = (value: string) => value.replace(/^0(?=\d)/, "");

function Content({ face, color, detail }: { face: MarkFace; color: string; detail: "hero" | "shelf" | "tiny" }) {
  const [y, size] = SHAPES[face.form][detail];
  const figure = detail === "tiny" ? stripZero(face.figure) : face.figure;
  const weight = detail === "tiny" ? 600 : detail === "shelf" ? 500 : 400;
  const outline = face.locked && detail === "hero" ? PENCIL : undefined;
  const pill = face.form === "streak" && detail === "hero";
  return (
    <g>
      <Numeral x={pill ? 40 : 60} y={y} size={size} value={figure} anchor="middle" weight={weight} fill={color} outline={outline} />
      {detail === "hero" ? (
        pill ? (
          <>
            <line x1={66} x2={66} y1={47} y2={73} strokeWidth={1.1} style={{ stroke: color }} />
            <Caption x={73} y={58} size={5.6} fill={color} opacity={0.9}>{face.label}</Caption>
            <Caption x={73} y={67} size={5.6} fill={color} opacity={0.9}>{face.label2}</Caption>
          </>
        ) : (
          <>
            <line x1={53} x2={67} y1={y + 8} y2={y + 8} strokeWidth={1.1} style={{ stroke: color }} />
            <Caption x={60} y={y + 19} size={5.4} anchor="middle" fill={color} opacity={0.9}>{face.label}</Caption>
          </>
        )
      ) : detail === "shelf" && face.form !== "streak" ? (
        <line x1={51} x2={69} y1={y + 9} y2={y + 9} strokeWidth={2.2} style={{ stroke: color }} />
      ) : null}
      {face.corner && detail === "hero" ? (
        <text x={60} y={108} fontSize={4.6} letterSpacing={0.6} textAnchor="middle" className={T.mono} style={{ fill: color }} opacity={0.75}>
          {face.corner}
        </text>
      ) : null}
    </g>
  );
}

function MarkShape({ face, size, unlocking }: { face: MarkFace; size: number; unlocking: boolean }) {
  const id = useSvgId("mk");
  const detail = detailForSize(size);
  const shape = SHAPES[face.form];
  const lineWidth = detail === "tiny" ? 7 : detail === "shelf" ? 2.6 : 1.4;
  const drawn = (
    <g>
      <path d={shape.d} fill="none" strokeWidth={lineWidth} strokeLinejoin="round" style={{ stroke: PENCIL }} />
      <Content face={{ ...face, locked: true }} color={PENCIL} detail={detail} />
    </g>
  );
  const inked = (
    <g>
      {face.top && detail !== "tiny" ? (
        <path d={shape.keyline} fill="none" strokeWidth={detail === "hero" ? 1.2 : 2.4} strokeLinejoin="round" style={{ stroke: face.ink }} />
      ) : null}
      <path d={shape.d} strokeLinejoin="round" strokeWidth={detail === "tiny" ? 0 : 1} style={{ fill: face.ink, stroke: face.ink }} />
      {detail === "hero" ? (
        <path d={shape.inset} fill="none" strokeWidth={0.6} strokeOpacity={0.55} strokeLinejoin="round" style={{ stroke: "var(--md-paper)" }} />
      ) : null}
      <Content face={face} color="var(--md-paper)" detail={detail} />
    </g>
  );
  if (face.locked) return <MarkSvg size={size}>{drawn}</MarkSvg>;
  if (!unlocking) return <MarkSvg size={size}>{inked}</MarkSvg>;
  return (
    <MarkSvg size={size}>
      <defs>
        <mask id={`${id}-rise`} maskUnits="userSpaceOnUse" x="-10" y="-10" width="140" height="140">
          {/* Ink rises from the baseline: a white sheet that grows upward. */}
          <rect className="md-fill" x="-10" y="-10" width="140" height="140" fill="#fff" />
        </mask>
      </defs>
      {drawn}
      <g mask={`url(#${id}-rise)`}>{inked}</g>
    </MarkSvg>
  );
}

/* ------------------------------------------------------------------ */

export function MarkMark({ rung, locked = false, size = 120, unlocking = false }: LevelMarkProps) {
  return (
    <MarkShape
      size={size}
      unlocking={unlocking}
      face={{ form: "level", figure: String(rung.level).padStart(2, "0"), label: "LEVEL", ink: "var(--md-ink)", locked }}
    />
  );
}

/** Category ink that holds on both papers: pulled slightly toward the page's ink. */
const goalInk = (color: string) => `color-mix(in srgb, ${color} 76%, var(--md-ink))`;

export function MarkFamilyMark({ family, size = 96, award, unlocking = false }: FamilyMarkProps) {
  const item = awardFor(family.key, award);
  const locked = !item.date;
  const pill = family.key === "streak";
  const face: MarkFace = {
    form: family.key,
    figure: item.figure,
    label: locked ? awardStatus(item) : pill ? "WEEKS" : item.label,
    label2: pill ? (locked ? "TO GO" : "ON PLAN") : undefined,
    ink: item.color ? goalInk(item.color) : "var(--md-ink)",
    locked,
    top: item.top,
    corner: family.key === "goal" && item.date ? awardStatus(item) : undefined,
  };
  return <MarkShape face={face} size={size} unlocking={unlocking} />;
}
