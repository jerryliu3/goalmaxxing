"use client";

import { awardFor, awardStatus, type Award } from "@/features/ux-medals/awards";
import type { FamilyMarkProps, LevelMarkProps } from "@/features/ux-medals/mark-kit";
import type { MedalFamilyKey } from "@/features/ux-medals/model";
import { Caption, Lines, Tick } from "@/features/ux-medals/modern-kit";
import { FORM_FOR, circlePath, ringPath, type PremiumForm } from "@/features/ux-medals/premium-forms";
import {
  BLANK,
  LADDER,
  awardFinish,
  ladderFinish,
  type Variant,
} from "@/features/ux-medals/premium-materials";
import {
  Numeral,
  PremiumMedal,
  Rule,
  groove,
  isCompact,
  type MedalCtx,
} from "@/features/ux-medals/premium-medal";
import { segmentPaths, wrapLines } from "@/features/ux-medals/svg-geometry";

/*
 * Round 3: the Round 2 mix (Token discs for levels, streaks, challenges; the
 * goal Tile; Mark's shield and hexagon for social families), rebuilt as
 * physical objects. The two variants differ in construction, not form:
 * Machined = thick polished rim, enamel band, engraved numerals; Prism =
 * thin bezel, crystal or foil face, raised foil numerals.
 */

/** Numeral baseline/size per detail, plus hero caption/rule/footer rows. */
interface Layout {
  cap: number;
  num: [number, number];
  rule: number;
  foot: number;
  shelf: [number, number];
  small: [number, number];
  tiny: [number, number];
}

const LAYOUT: Record<Exclude<PremiumForm, "tile">, Layout> = {
  disc: { cap: 33, num: [72, 36], rule: 80, foot: 91, shelf: [75, 42], small: [77, 46], tiny: [80, 56] },
  notched: { cap: 33, num: [72, 36], rule: 80, foot: 91, shelf: [75, 42], small: [77, 46], tiny: [80, 56] },
  shield: { cap: 31, num: [63, 32], rule: 70, foot: 80, shelf: [66, 40], small: [68, 46], tiny: [71, 54] },
  hexagon: { cap: 36, num: [69, 34], rule: 77, foot: 88, shelf: [74, 42], small: [76, 46], tiny: [79, 56] },
};

/** The centred face shared by every non-goal form: overline, numeral, rule, name. */
function CenterFace({ m, form, overline, figure, footer }: { m: MedalCtx; form: Exclude<PremiumForm, "tile">; overline: string; figure: string; footer: string }) {
  const layout = LAYOUT[form];
  if (m.detail !== "hero") {
    const [y, size] = layout[m.detail];
    return <Numeral m={m} value={figure} y={y} size={size} />;
  }
  return (
    <>
      <Caption x={60} y={layout.cap} size={4.8} anchor="middle" fill={m.finish.type} opacity={0.8}>
        {overline}
      </Caption>
      <Numeral m={m} value={figure} y={layout.num[0]} size={layout.num[1]} />
      <Rule m={m} y={layout.rule} />
      <Lines x={60} y={layout.foot} lines={wrapLines(footer, 16, 1)} size={6.4} anchor="middle" fill={m.finish.type} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Levels: the material ladder on a turned disc.                        */
/* ------------------------------------------------------------------ */

function PremiumLevel({ variant, rung, name, locked = false, size = 120, unlocking = false, tilt }: LevelMarkProps & { variant: Variant }) {
  const finish = locked ? BLANK : ladderFinish(variant, LADDER[rung.index]!.key);
  return (
    <PremiumMedal variant={variant} form="disc" family="level" finish={finish} size={size} locked={locked} unlocking={unlocking} tilt={tilt}>
      {(m) => <CenterFace m={m} form="disc" overline="LEVEL" figure={String(rung.level).padStart(2, "0")} footer={name} />}
    </PremiumMedal>
  );
}

/* ------------------------------------------------------------------ */
/* Streaks: the band is the run, one segment per week.                  */
/* ------------------------------------------------------------------ */

function streakBand(award: Award) {
  return function StreakBand(m: MedalCtx) {
    const weeks = Number(award.figure);
    const lit = m.locked ? award.progress?.[0] ?? 0 : weeks;
    const gap = Math.min(5, (360 / weeks) * 0.34);
    if (m.variant === "machined") {
      const outer = 56 - m.rimIn;
      const inner = 56 - m.bandIn!;
      const ring = ringPath(circlePath(outer), circlePath(inner));
      if (isCompact(m)) {
        return <path d={ring} fillRule="evenodd" style={{ fill: m.locked ? groove(m) : m.paint("enamel") }} />;
      }
      return (
        <g>
          <path d={ring} fillRule="evenodd" style={{ fill: groove(m) }} />
          {segmentPaths((outer + inner) / 2, weeks, gap).map((d, index) =>
            index < lit ? (
              <path
                key={index}
                d={d}
                fill="none"
                strokeWidth={outer - inner - 1.6}
                stroke={m.locked ? undefined : m.paint("enamel")}
                style={m.locked ? { stroke: m.finish.ink[0] } : undefined}
              />
            ) : null
          )}
          {m.locked ? null : <path d={ring} fillRule="evenodd" fill={m.paint("clear")} />}
        </g>
      );
    }
    if (isCompact(m)) return null;
    // Prism: a channel of set stones — lit weeks are foil, the rest a hairline.
    const r = 56 - m.rimIn - 4.4;
    return (
      <g>
        {segmentPaths(r, weeks, gap).map((d, index) =>
          index < lit ? (
            <path
              key={index}
              d={d}
              fill="none"
              strokeWidth={m.detail === "hero" ? 2.6 : 3.6}
              stroke={m.locked ? undefined : m.paint(m.finish.foil ? "spectrum" : "ink")}
              style={m.locked ? { stroke: m.finish.type } : undefined}
            />
          ) : (
            <path key={index} d={d} fill="none" strokeWidth={0.6} strokeOpacity={0.35} style={{ stroke: m.finish.type }} />
          )
        )}
      </g>
    );
  };
}

/* ------------------------------------------------------------------ */
/* Goal finishes: the card, kept — in the card's own material.          */
/* ------------------------------------------------------------------ */

function GoalFace({ m, award }: { m: MedalCtx; award: Award }) {
  const ink = m.finish.type;
  if (m.detail === "tiny" || m.detail === "small") {
    return m.locked ? (
      <Numeral m={m} value={award.figure} y={m.detail === "tiny" ? 80 : 76} size={m.detail === "tiny" ? 54 : 46} />
    ) : (
      <Tick x={60} y={61} size={m.detail === "tiny" ? 48 : 42} stroke={ink} width={m.detail === "tiny" ? 10 : 7} />
    );
  }
  const [done, need] = award.progress ?? [1, 1];
  const bar = (x: number, y: number, width: number) =>
    m.locked ? (
      <g>
        <rect x={x} y={y} width={width} height={2.6} rx={1.3} style={{ fill: groove(m) }} opacity={0.5} />
        <rect x={x} y={y} width={(width * done) / need} height={2.6} rx={1.3} style={{ fill: ink }} />
      </g>
    ) : (
      <rect x={x} y={y} width={width} height={3.4} rx={1.7} fill={m.paint(m.variant === "machined" ? "enamel" : m.finish.foil ? "spectrum" : "ink")} />
    );
  if (m.detail === "shelf") {
    return (
      <>
        {m.locked ? null : <Tick x={94} y={20} size={11} stroke={ink} width={1.8} />}
        <Numeral m={m} value={award.figure} x={21} y={60} size={42} anchor="start" />
        {bar(22, 94, m.locked ? 76 : 30)}
      </>
    );
  }
  const unitX = 21 + award.figure.length * 32 * 0.52 + 3;
  return (
    <>
      <Caption x={22} y={21} size={4.8} fill={ink} opacity={0.8}>
        {m.locked ? "IN PROGRESS" : "ACHIEVED"}
      </Caption>
      {m.locked ? null : <Tick x={96} y={19.5} size={7} stroke={ink} width={1} />}
      <Numeral m={m} value={award.figure} x={21} y={50} size={32} anchor="start" />
      <Lines x={unitX} y={39} lines={award.unit} size={5.6} fill={ink} weight={400} />
      <Lines x={21} y={64} lines={wrapLines(award.title, 17)} size={7.6} fill={ink} />
      {m.locked ? bar(21, 77, 78) : <Rule m={m} x={60} half={39} y={78.5} />}
      {award.reward ? <Lines x={21} y={88} lines={wrapLines(award.reward, 27)} size={6} weight={400} italic fill={ink} /> : null}
      <Caption x={22} y={104} size={4.4} fill={ink} opacity={0.75}>
        {award.label}
      </Caption>
      <Caption x={98} y={104} size={4.4} anchor="end" fill={ink} opacity={0.75}>
        {awardStatus(award)}
      </Caption>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Families.                                                            */
/* ------------------------------------------------------------------ */

const footerFor: Record<Exclude<MedalFamilyKey, "goal">, (award: Award) => [string, string]> = {
  streak: (award) => [award.date ? "STREAK" : awardStatus(award), award.unit.join(" ")],
  challenge: (award) => [award.date ? `CHALLENGE · ${award.label}` : awardStatus(award), award.title],
  leaderboard: (award) => [award.unit[0].toUpperCase(), award.date ? award.title.split(" · ")[1] ?? award.title : "Not yet"],
  team: (award) => [`TEAM · ${award.label}`, award.title.split(" · ")[0]!],
};

function PremiumFamily({ variant, family, size = 96, award, unlocking = false, tilt }: FamilyMarkProps & { variant: Variant }) {
  const item = awardFor(family.key, award);
  const locked = !item.date;
  const form = FORM_FOR[family.key];
  const shared = {
    variant,
    form,
    family: family.key,
    finish: awardFinish(variant, item),
    size,
    locked,
    unlocking,
    tilt,
  } as const;
  if (family.key === "goal") {
    return <PremiumMedal {...shared}>{(m) => <GoalFace m={m} award={item} />}</PremiumMedal>;
  }
  const [overline, footer] = footerFor[family.key as Exclude<MedalFamilyKey, "goal">](item);
  const centered = form as Exclude<PremiumForm, "tile">;
  return (
    <PremiumMedal {...shared} band={family.key === "streak" ? streakBand(item) : undefined}>
      {(m) => <CenterFace m={m} form={centered} overline={overline} figure={item.figure} footer={footer} />}
    </PremiumMedal>
  );
}

/* ------------------------------------------------------------------ */

export function MachinedMark(props: LevelMarkProps) {
  return <PremiumLevel variant="machined" {...props} />;
}

export function MachinedFamilyMark(props: FamilyMarkProps) {
  return <PremiumFamily variant="machined" {...props} />;
}

export function PrismMark(props: LevelMarkProps) {
  return <PremiumLevel variant="prism" {...props} />;
}

export function PrismFamilyMark(props: FamilyMarkProps) {
  return <PremiumFamily variant="prism" {...props} />;
}
