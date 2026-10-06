"use client";

import type { ComponentType, ReactNode } from "react";
import { awardFor, awardHex, awardStatus, type Award } from "@/features/ux-medals/awards";
import { MarkSvg, type FamilyMarkProps, type LevelMarkProps } from "@/features/ux-medals/mark-kit";
import { TIER_LABEL, tierHex, type MedalFamilyKey } from "@/features/ux-medals/model";
import {
  CARD,
  Caption,
  Figure,
  Lines,
  Numeral,
  PENCIL,
  RestShadow,
  Steps,
  Tick,
  deepen,
  tint,
  useFace,
  type Face,
} from "@/features/ux-medals/modern-kit";
import { roundedRectPath, wrapLines } from "@/features/ux-medals/svg-geometry";

/*
 * M5 Tile — every medal is a miniature of the goal card. Earned tiles are
 * physical (card face + hero tint, like the card in any theme); locked tiles
 * are the die line on the page. Families differ by proportion.
 */

/** Tile surface: tinted card stock with a resting shadow, or a die line when locked. */
function Body({ d, face, inset }: { d: string; face: Face; inset?: string }) {
  if (face.locked) {
    return <path d={d} fill="none" strokeWidth={face.tiny ? 6 : 1.1} strokeLinejoin="round" style={{ stroke: PENCIL }} />;
  }
  return (
    <>
      <path d={d} filter={face.tiny ? undefined : `url(#${face.id}-sh)`} style={{ fill: face.tiny ? face.accent : tint(face.accent) }} />
      {face.tiny ? null : <path d={d} fill="none" stroke={CARD.ink} strokeOpacity={0.09} strokeWidth={0.8} />}
      {inset && face.hero ? (
        <path
          d={inset}
          fill="none"
          pathLength={1}
          strokeWidth={0.5}
          strokeOpacity={0.4}
          className={face.unlocking ? "md-draw" : undefined}
          style={{ stroke: deepen(face.accent) }}
        />
      ) : null}
    </>
  );
}

function Tile({ size, face, children }: { size: number; face: Face; children: ReactNode }) {
  return (
    <MarkSvg size={size}>
      <defs>
        <RestShadow id={`${face.id}-sh`} />
      </defs>
      {children}
    </MarkSvg>
  );
}

/** Two-line unit beside a numeral, placed from the figure's approximate width. */
function Unit({ face, x, y, size, lines, figure, figureSize }: { face: Face; x: number; y: number; size: number; lines: readonly string[]; figure: string; figureSize: number }) {
  return <Lines x={x + figure.length * figureSize * 0.47 + 3} y={y} lines={lines} size={size} weight={400} fill={face.ink} />;
}

/** Honest progress as a hairline: done portion firm, the rest faint. */
function Progress({ x, y, width, award }: { x: number; y: number; width: number; award: Award }) {
  const [done, need] = award.progress ?? [0, 1];
  const end = x + (width * done) / need;
  return (
    <g style={{ stroke: PENCIL }} strokeLinecap="round">
      <line x1={x} x2={x + width} y1={y} y2={y} strokeWidth={0.5} />
      <line x1={x} x2={end} y1={y} y2={y} strokeWidth={1.4} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Levels: the square tile. Rank shows on the card's effort bars.       */
/* ------------------------------------------------------------------ */

export function TileMark({ rung, name, locked = false, size = 120, unlocking = false }: LevelMarkProps) {
  const face = useFace(tierHex(rung.tier), size, locked, unlocking);
  const value = String(rung.level).padStart(2, "0");
  return (
    <Tile size={size} face={face}>
      <Body d={roundedRectPath(8, 8, 104, 104, 10)} inset={roundedRectPath(13, 13, 94, 94, 6)} face={face} />
      {face.tiny ? (
        <Figure face={face} x={60} y={85} size={68} value={String(rung.level)} anchor="middle" />
      ) : face.hero ? (
        <>
          <Caption x={18} y={26} fill={face.ink}>RANK</Caption>
          <Caption x={102} y={26} anchor="end" fill={face.ink}>{TIER_LABEL[rung.tier].toUpperCase()}</Caption>
          <Figure face={face} x={15} y={80} size={50} value={value} />
          <Unit face={face} x={15} y={62} size={7} lines={["level", locked ? "ahead" : "earned"]} figure={value} figureSize={50} />
          <Lines x={18} y={101} lines={[name]} size={8.5} fill={face.ink} />
          <Steps right={102} base={101} count={5} active={rung.index + 1} fill={deepen(face.accent)} outline={locked ? PENCIL : undefined} />
        </>
      ) : (
        <>
          <Figure face={face} x={15} y={78} size={58} value={value} />
          <Steps right={103} base={101} count={5} active={rung.index + 1} fill={deepen(face.accent)} outline={locked ? PENCIL : undefined} width={4.4} gap={2.4} k={1.6} />
        </>
      )}
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/* Goal finishes: the card's own proportion, its numeral, its reward.   */
/* ------------------------------------------------------------------ */

function GoalTile({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const d = roundedRectPath(12, 4, 96, 112, 6.5);
  return (
    <Tile size={size} face={face}>
      <Body d={d} inset={roundedRectPath(16.5, 8.5, 87, 103, 3.5)} face={face} />
      {face.tiny ? (
        locked ? (
          <Figure face={face} x={60} y={75} size={46} value={award.figure} anchor="middle" />
        ) : (
          <Tick x={60} y={60} size={48} stroke={CARD.face} width={9} />
        )
      ) : face.hero ? (
        <>
          <Caption x={19} y={17.5} size={5} fill={face.ink}>{locked ? "IN PROGRESS" : "ACHIEVED"}</Caption>
          {locked ? null : <Tick x={98} y={15.5} size={7} stroke={CARD.ink} width={1} />}
          <Figure face={face} x={18} y={47} size={32} value={award.figure} />
          <Unit face={face} x={18} y={36} size={5.8} lines={award.unit} figure={award.figure} figureSize={32} />
          <Lines x={18} y={62} lines={wrapLines(award.title, 17)} size={8} fill={face.ink} />
          {locked ? (
            <Progress x={18} y={78} width={84} award={award} />
          ) : (
            <line x1={18} x2={102} y1={78} y2={78} stroke={CARD.ink} strokeOpacity={0.2} strokeWidth={0.5} />
          )}
          {award.reward ? (
            <Lines x={18} y={88} lines={wrapLines(award.reward, 26)} size={6.4} weight={400} italic fill={face.ink} />
          ) : null}
          <Caption x={19} y={110} size={4.6} fill={face.ink}>{award.label}</Caption>
          <Caption x={101} y={110} size={4.6} anchor="end" fill={face.ink}>{awardStatus(award)}</Caption>
        </>
      ) : (
        <>
          {locked ? null : <Tick x={95} y={18} size={11} stroke={CARD.ink} width={1.8} />}
          <Figure face={face} x={19} y={58} size={42} value={award.figure} />
          {locked ? (
            <Progress x={20} y={98} width={80} award={award} />
          ) : (
            <rect x={20} y={96} width={30} height={3.4} rx={1.7} style={{ fill: deepen(face.accent) }} />
          )}
        </>
      )}
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/* Streaks: the wide strip, with the four milestones as pips.           */
/* ------------------------------------------------------------------ */

const MILESTONES = [4, 12, 26, 52] as const;

function StreakTile({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const weeks = Number(award.figure);
  const y = face.tiny ? 22 : 28;
  const h = face.tiny ? 76 : 64;
  const pip = face.hero ? 5 : 7.5;
  const pips = MILESTONES.map((mark, index) => {
    const earned = mark < weeks || (mark === weeks && !locked);
    const x = 108 - (MILESTONES.length - index) * (pip + 2.2) + 2.2;
    const base = face.hero ? 80 : 82;
    return earned ? (
      <rect key={mark} x={x} y={base - pip} width={pip} height={pip} rx={1} style={{ fill: locked ? PENCIL : deepen(face.accent) }} />
    ) : (
      <rect key={mark} x={x + 0.3} y={base - pip + 0.3} width={pip - 0.6} height={pip - 0.6} rx={1} fill="none" strokeWidth={0.6} style={{ stroke: face.ink }} />
    );
  });
  return (
    <Tile size={size} face={face}>
      <Body d={roundedRectPath(4, y, 112, h, 8)} inset={roundedRectPath(8, y + 4, 104, h - 8, 4.5)} face={face} />
      {face.tiny ? (
        <Figure face={face} x={60} y={79} size={54} value={award.figure} anchor="middle" />
      ) : face.hero ? (
        <>
          <Caption x={12} y={41} fill={face.ink}>STREAK</Caption>
          <Caption x={108} y={41} anchor="end" fill={face.ink}>{awardStatus(award)}</Caption>
          <Figure face={face} x={11} y={80} size={36} value={award.figure} />
          <Unit face={face} x={11} y={67} size={6.2} lines={award.unit} figure={award.figure} figureSize={36} />
          {pips}
          {locked ? <Progress x={12} y={86} width={96} award={award} /> : null}
        </>
      ) : (
        <>
          <Figure face={face} x={11} y={82} size={44} value={award.figure} />
          {pips}
        </>
      )}
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/* Challenges: a ticket — perforated stub, solid when you won.          */
/* ------------------------------------------------------------------ */

const STUB = 82;

function ticketPath(x: number, y: number, w: number, h: number, r: number, ny: number, n: number) {
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${ny - n} A ${n} ${n} 0 0 0 ${x + w} ${ny + n} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${ny + n} A ${n} ${n} 0 0 0 ${x} ${ny - n} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

function ChallengeTile({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const d = ticketPath(10, 8, 100, 104, 8, STUB, 5);
  const won = award.top && !locked;
  return (
    <Tile size={size} face={face}>
      <defs>
        <clipPath id={`${face.id}-ticket`}>
          <path d={d} />
        </clipPath>
      </defs>
      <Body d={d} face={face} />
      {won ? (
        <rect x="0" y={STUB} width="120" height="40" clipPath={`url(#${face.id}-ticket)`} style={{ fill: deepen(face.accent, face.tiny ? 55 : 88) }} />
      ) : null}
      {face.tiny ? null : (
        <line x1={17} x2={103} y1={STUB} y2={STUB} strokeDasharray="1.6 2" strokeWidth={face.hero ? 0.6 : 1.2} strokeOpacity={0.45} style={{ stroke: face.ink }} />
      )}
      {face.tiny ? (
        <Figure face={face} x={60} y={64} size={48} value={award.figure} anchor="middle" />
      ) : face.hero ? (
        <>
          <Caption x={18} y={24} fill={face.ink}>CHALLENGE</Caption>
          <Figure face={face} x={17} y={57} size={34} value={award.figure} />
          <Unit face={face} x={17} y={44} size={6} lines={award.unit} figure={award.figure} figureSize={34} />
          <Lines x={18} y={72} lines={wrapLines(award.title, 21, 1)} size={7.5} fill={face.ink} />
          <Caption x={60} y={99} anchor="middle" fill={won ? CARD.face : face.ink} opacity={won ? 1 : 0.72}>
            {locked ? awardStatus(award) : `${award.label} · ${awardStatus(award)}`}
          </Caption>
        </>
      ) : (
        <Figure face={face} x={18} y={66} size={46} value={award.figure} />
      )}
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/* Leaderboards: the podium step. First place inks the top block.       */
/* ------------------------------------------------------------------ */

const PODIUM =
  "M 44 8 H 76 A 8 8 0 0 1 84 16 V 52 A 4 4 0 0 0 88 56 H 106 A 8 8 0 0 1 114 64 V 104 A 8 8 0 0 1 106 112 H 14 A 8 8 0 0 1 6 104 V 64 A 8 8 0 0 1 14 56 H 32 A 4 4 0 0 0 36 52 V 16 A 8 8 0 0 1 44 8 Z";

function BoardTile({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const first = award.top && !locked && !face.tiny;
  return (
    <Tile size={size} face={face}>
      <defs>
        <clipPath id={`${face.id}-podium`}>
          <path d={PODIUM} />
        </clipPath>
      </defs>
      <Body d={PODIUM} face={face} />
      {first ? <rect x="36" y="0" width="48" height="56" clipPath={`url(#${face.id}-podium)`} style={{ fill: deepen(face.accent) }} /> : null}
      {face.tiny ? (
        <Figure face={face} x={60} y={46} size={36} value={award.figure} anchor="middle" />
      ) : (
        <>
          {face.hero ? (
            <Caption x={60} y={20} anchor="middle" size={5} fill={first ? CARD.face : face.ink}>
              {award.unit[0].toUpperCase()}
            </Caption>
          ) : null}
          {first ? (
            <Numeral x={60} y={face.hero ? 47 : 48} size={face.hero ? 30 : 36} value={award.figure} anchor="middle" fill={CARD.face} />
          ) : (
            <Figure face={face} x={60} y={face.hero ? 47 : 48} size={face.hero ? 30 : 36} value={award.figure} anchor="middle" />
          )}
          {face.hero ? (
            <>
              <Lines x={60} y={79} lines={wrapLines(award.title, 22, 1)} size={7} anchor="middle" fill={face.ink} />
              <Caption x={14} y={104} size={4.8} fill={face.ink}>{award.label}</Caption>
              <Caption x={106} y={104} size={4.8} anchor="end" fill={face.ink}>{awardStatus(award)}</Caption>
            </>
          ) : null}
        </>
      )}
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/* Team: two tiles, stacked. The anchor's back tile is inked.           */
/* ------------------------------------------------------------------ */

function TeamTile({ award, size, unlocking }: FormProps) {
  const locked = !award.date;
  const face = useFace(awardHex(award), size, locked, unlocking);
  const back = roundedRectPath(24, 6, 88, 88, 9);
  return (
    <Tile size={size} face={face}>
      {locked ? (
        <path d={back} fill="none" strokeDasharray={face.tiny ? undefined : "2 2.4"} strokeWidth={face.tiny ? 5 : 0.9} style={{ stroke: PENCIL }} />
      ) : (
        <path d={back} style={{ fill: face.tiny || award.top ? face.accent : tint(face.accent, 12) }} opacity={face.tiny ? 0.45 : 1} />
      )}
      <Body d={roundedRectPath(8, 26, 88, 88, 9)} inset={roundedRectPath(12.5, 30.5, 79, 79, 5)} face={face} />
      {face.tiny ? (
        <Figure face={face} x={52} y={88} size={44} value={award.figure} anchor="middle" />
      ) : face.hero ? (
        <>
          <Caption x={16} y={41} fill={face.ink}>{award.label}</Caption>
          <Figure face={face} x={15} y={80} size={34} value={award.figure} />
          <Unit face={face} x={15} y={66} size={6} lines={award.unit} figure={award.figure} figureSize={34} />
          <Lines x={16} y={101} lines={wrapLines(award.title.split(" · ")[0]!, 18, 1)} size={7.5} fill={face.ink} />
        </>
      ) : (
        <Figure face={face} x={16} y={92} size={44} value={award.figure} />
      )}
    </Tile>
  );
}

/* ------------------------------------------------------------------ */

interface FormProps {
  award: Award;
  size: number;
  unlocking: boolean;
}

const FORMS: Record<MedalFamilyKey, ComponentType<FormProps>> = {
  goal: GoalTile,
  streak: StreakTile,
  challenge: ChallengeTile,
  leaderboard: BoardTile,
  team: TeamTile,
};

export function TileFamilyMark({ family, size = 96, award, unlocking = false }: FamilyMarkProps) {
  const Form = FORMS[family.key];
  return <Form award={awardFor(family.key, award)} size={size} unlocking={unlocking} />;
}
