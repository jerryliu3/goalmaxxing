"use client";

import type { ComponentType, ReactNode } from "react";
import { awardFor, awardHex, awardStatus, type Award } from "@/features/ux-medals/awards";
import { MarkSvg, type FamilyMarkProps, type LevelMarkProps } from "@/features/ux-medals/mark-kit";
import { tierHex, type MedalFamilyKey } from "@/features/ux-medals/model";
import {
  CARD,
  Caption,
  Figure,
  Lines,
  Numeral,
  PENCIL,
  RestShadow,
  Tick,
  deepen,
  tint,
  useFace,
  type Face,
} from "@/features/ux-medals/modern-kit";
import {
  notchedCirclePath,
  polygonPath,
  segmentPaths,
  wrapLines,
} from "@/features/ux-medals/svg-geometry";

/*
 * M6 Token — the seal, modernised. A disc of card stock, one inset hairline,
 * an embossed numeral, straight mono captions. Families change only the edge;
 * the strongest variant of any family (won, first, anchor) is solid.
 */

const circle = (r: number) => `M ${60 - r} 60 A ${r} ${r} 0 1 1 ${60 + r} 60 A ${r} ${r} 0 1 1 ${60 - r} 60 Z`;

const DISC = circle(54);
const RING = 47;

/** Locked: pressed into the page with no ink — shadow up-left, light down-right. */
function Deboss({ d, ring }: { d: string; ring: boolean }) {
  const pass = (path: string, dx: number, color: string, width: number) => (
    <path d={path} transform={`translate(${dx} ${dx})`} fill="none" strokeWidth={width} style={{ stroke: color }} />
  );
  return (
    <g>
      <path d={d} style={{ fill: "color-mix(in srgb, var(--md-lo) 12%, transparent)" }} />
      {pass(d, -0.5, "var(--md-lo)", 0.9)}
      {pass(d, 0.5, "var(--md-hi)", 0.9)}
      {ring ? pass(circle(RING), 0.4, "var(--md-lo)", 0.5) : null}
      {ring ? pass(circle(RING), -0.4, "var(--md-hi)", 0.5) : null}
    </g>
  );
}

interface TokenProps {
  face: Face;
  size: number;
  d: string;
  /** Solid variant: won, first place, anchor. */
  top?: boolean;
  /** Replaces the plain hairline ring (goal band, streak segments, team double ring). */
  ring?: ReactNode;
  overline: string;
  figure: string;
  footer: string;
  /** Tiny faces can swap the numeral for a glyph (goal tick). */
  tinyGlyph?: ReactNode;
}

function Token({ face, size, d, top = false, ring, overline, figure, footer, tinyGlyph }: TokenProps) {
  const solid = top && !face.locked;
  const ink = solid ? CARD.face : face.ink;
  const ringStroke = solid ? CARD.face : deepen(face.accent);
  const tinyFigure = figure.replace(/^0(?=\d)/, "");
  return (
    <MarkSvg size={size}>
      <defs>
        <RestShadow id={`${face.id}-sh`} />
      </defs>
      {face.locked ? (
        face.tiny ? (
          <path d={d} fill="none" strokeWidth={6} style={{ stroke: PENCIL }} />
        ) : (
          <Deboss d={d} ring={!ring} />
        )
      ) : (
        <>
          <path
            d={d}
            filter={face.tiny ? undefined : `url(#${face.id}-sh)`}
            style={{ fill: face.tiny || solid ? deepen(face.accent, face.tiny ? 100 : 88) : tint(face.accent, 20) }}
          />
          {face.tiny ? null : <path d={d} fill="none" stroke={CARD.ink} strokeOpacity={0.1} strokeWidth={0.8} />}
          {face.tiny || ring ? null : (
            <circle
              cx="60"
              cy="60"
              r={RING}
              fill="none"
              pathLength={1}
              transform="rotate(-90 60 60)"
              strokeWidth={face.hero ? 0.8 : 1.6}
              strokeOpacity={solid ? 0.6 : 1}
              className={face.unlocking ? "md-draw" : undefined}
              style={{ stroke: ringStroke }}
            />
          )}
        </>
      )}
      {face.tiny ? null : ring}
      {face.tiny ? (
        tinyGlyph && !face.locked ? (
          tinyGlyph
        ) : (
          <Figure face={face} x={60} y={80} size={tinyFigure.length > 1 ? 54 : 62} value={tinyFigure} anchor="middle" />
        )
      ) : (
        <g className={face.unlocking ? "md-rise" : undefined}>
          {face.hero ? <Caption x={60} y={35} size={5} anchor="middle" fill={ink}>{overline}</Caption> : null}
          {solid ? (
            <Numeral x={60} y={face.hero ? 71 : 76} size={face.hero ? 36 : 46} value={figure} anchor="middle" fill={CARD.face} />
          ) : (
            <Figure face={face} x={60} y={face.hero ? 71 : 76} size={face.hero ? 36 : 46} value={figure} anchor="middle" />
          )}
          {face.hero ? (
            <>
              <line x1={54} x2={66} y1={79} y2={79} strokeWidth={0.7} strokeOpacity={0.5} style={{ stroke: ink }} />
              <Lines x={60} y={90} lines={wrapLines(footer, 18, 1)} size={6.8} anchor="middle" fill={ink} />
            </>
          ) : null}
        </g>
      )}
    </MarkSvg>
  );
}

/* ------------------------------------------------------------------ */

export function TokenMark({ rung, name, locked = false, size = 120, unlocking = false }: LevelMarkProps) {
  const face = useFace(tierHex(rung.tier), size, locked, unlocking);
  return <Token face={face} size={size} d={DISC} overline="LEVEL" figure={String(rung.level).padStart(2, "0")} footer={name} />;
}

interface FormProps {
  award: Award;
  size: number;
  unlocking: boolean;
}

/** Goal finish: a solid category band where the ring was. Locked, the band is honest progress. */
function GoalToken({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const [done, need] = award.progress ?? [1, 1];
  const band = locked ? (
    <circle
      cx="60"
      cy="60"
      r={50.5}
      fill="none"
      pathLength={1}
      strokeDasharray={`${done / need} 1`}
      transform="rotate(-90 60 60)"
      strokeWidth={face.hero ? 1.6 : 3}
      style={{ stroke: PENCIL }}
    />
  ) : (
    <circle
      cx="60"
      cy="60"
      r={50.5}
      fill="none"
      pathLength={1}
      transform="rotate(-90 60 60)"
      strokeWidth={7}
      className={unlocking ? "md-draw" : undefined}
      style={{ stroke: face.accent }}
    />
  );
  return (
    <Token
      face={face}
      size={size}
      d={DISC}
      ring={band}
      overline={locked ? "IN PROGRESS" : "ACHIEVED"}
      figure={award.figure}
      footer={wrapLines(award.title, 18, 1)[0]!}
      tinyGlyph={<Tick x={60} y={61} size={50} stroke={CARD.face} width={9} />}
    />
  );
}

/** Streak: the ring is the run — one segment per week of the milestone. */
function StreakToken({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const weeks = Number(award.figure);
  const lit = locked ? award.progress?.[0] ?? 0 : weeks;
  const gap = Math.min(5, (360 / weeks) * 0.34);
  const segments = segmentPaths(RING, weeks, gap).map((d, index) => (
    <path
      key={index}
      d={d}
      fill="none"
      strokeLinecap="butt"
      strokeWidth={index < lit ? (face.hero ? 3 : 5) : 0.7}
      className={unlocking ? "md-seg" : undefined}
      style={{
        stroke: locked ? PENCIL : deepen(face.accent),
        opacity: index < lit ? 1 : 0.5,
        animationDelay: unlocking ? `${200 + index * Math.min(60, 900 / weeks)}ms` : undefined,
      }}
    />
  ));
  if (face.tiny) {
    return (
      <MarkSvg size={size}>
        {segmentPaths(53, 4, 26).map((d, index) => (
          <path key={index} d={d} fill="none" strokeWidth={7} style={{ stroke: locked ? PENCIL : face.accent }} />
        ))}
        {locked ? (
          <circle cx="60" cy="60" r="42" fill="none" strokeWidth={5} style={{ stroke: PENCIL }} />
        ) : (
          <circle cx="60" cy="60" r="42" style={{ fill: deepen(face.accent, 100) }} />
        )}
        <Figure face={face} x={60} y={76} size={44} value={award.figure} anchor="middle" />
      </MarkSvg>
    );
  }
  return (
    <Token
      face={face}
      size={size}
      d={DISC}
      ring={<g>{segments}</g>}
      overline={locked ? awardStatus(award) : "STREAK"}
      figure={award.figure}
      footer={award.unit.join(" ")}
    />
  );
}

function ChallengeToken({ award, size, unlocking }: FormProps) {
  const face = useFace(awardHex(award), size, !award.date, unlocking);
  return (
    <Token
      face={face}
      size={size}
      d={notchedCirclePath(54, 8, 4.2, 22.5)}
      top={award.top}
      overline={award.date ? `CHALLENGE · ${award.label}` : awardStatus(award)}
      figure={award.figure}
      footer={award.title}
    />
  );
}

function BoardToken({ award, size, unlocking }: FormProps) {
  const face = useFace(awardHex(award), size, !award.date, unlocking);
  return (
    <Token
      face={face}
      size={size}
      d={polygonPath(57, 8, 22.5)}
      top={award.top}
      overline={award.unit[0].toUpperCase()}
      figure={award.figure}
      footer={award.date ? award.title.split(" · ")[1] ?? award.title : "Not yet"}
    />
  );
}

function TeamToken({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const rings = locked ? null : (
    <g fill="none" strokeWidth={face.hero ? 0.7 : 1.4} style={{ stroke: award.top ? CARD.face : deepen(face.accent) }}>
      <circle cx="60" cy="60" r={RING} />
      <circle cx="60" cy="60" r={RING - 3.2} />
    </g>
  );
  return (
    <Token
      face={face}
      size={size}
      d={DISC}
      top={award.top}
      ring={rings}
      overline={`TEAM · ${award.label}`}
      figure={award.figure}
      footer={award.title.split(" · ")[0]!}
    />
  );
}

const FORMS: Record<MedalFamilyKey, ComponentType<FormProps>> = {
  goal: GoalToken,
  streak: StreakToken,
  challenge: ChallengeToken,
  leaderboard: BoardToken,
  team: TeamToken,
};

export function TokenFamilyMark({ family, size = 96, award, unlocking = false }: FamilyMarkProps) {
  const Form = FORMS[family.key];
  return <Form award={awardFor(family.key, award)} size={size} unlocking={unlocking} />;
}
