"use client";

import type { ReactNode } from "react";
import type { AwardTier } from "@/features/achievements/types";
import {
  ArcText,
  FAMILY_TIER,
  FamilyGlyph,
  MarkSvg,
  T,
  type FamilyMarkProps,
  type LevelMarkProps,
} from "@/features/ux-medals/mark-kit";
import { FOIL, tierInk, type MedalFamilyKey } from "@/features/ux-medals/model";
import {
  bottomArc,
  detailForSize,
  guillochePath,
  polar,
  scallopPath,
  starPath,
  topArc,
  useSvgId,
} from "@/features/ux-medals/svg-geometry";

const LEVEL_EDGE = scallopPath(53, 30);
const PAPER = "var(--md-paper)";

interface FaceText {
  top: string;
  bottom: string;
  center: ReactNode;
}

/** Everything pressed into the paper, drawn in currentColor so ink and blind modes share it. */
function SealLines({ id, text, guilloche, centerFill }: { id: string; text: FaceText; guilloche: boolean; centerFill?: string }) {
  return (
    <>
      {guilloche ? (
        <path d={guillochePath(11, 5, 13.5, 900)} fill="none" stroke="currentColor" strokeWidth="0.32" opacity="0.5" />
      ) : null}
      <circle cx="60" cy="60" r="33.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="31.8" fill="none" stroke="currentColor" strokeWidth="0.4" />
      <ArcText pathId={`${id}-top`} size={8} spacing={1.5}>
        {text.top}
      </ArcText>
      <ArcText pathId={`${id}-bottom`} size={5.8} spacing={1.2}>
        {text.bottom}
      </ArcText>
      {[90, 270].map((deg) => {
        const [x, y] = polar(39.8, deg);
        return <path key={deg} d={`M ${x} ${y - 2.2} L ${x + 1.6} ${y} L ${x} ${y + 2.2} L ${x - 1.6} ${y} Z`} fill="currentColor" />;
      })}
      <circle cx="60" cy="60" r="16" style={centerFill ? { fill: centerFill } : undefined} fill="none" stroke="currentColor" strokeWidth="0.8" />
      {text.center}
    </>
  );
}

function SealDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={FOIL.light} />
        <stop offset="0.45" stopColor={FOIL.mid} />
        <stop offset="0.7" stopColor={FOIL.light} />
        <stop offset="1" stopColor={FOIL.deep} />
      </linearGradient>
      {/* Inner shadow: the plate bit into the stock. */}
      <filter id={`${id}-bite`} x="-5%" y="-5%" width="110%" height="110%">
        <feOffset dx="0.6" dy="0.9" />
        <feGaussianBlur stdDeviation="0.9" result="offset" />
        <feComposite operator="out" in="SourceGraphic" in2="offset" result="inverse" />
        <feFlood floodColor="#000" floodOpacity="0.45" />
        <feComposite operator="in" in2="inverse" result="shadow" />
        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
      </filter>
      <path id={`${id}-top`} d={topArc(36.5)} />
      <path id={`${id}-bottom`} d={bottomArc(43)} />
    </>
  );
}

function InkedSeal({ id, tier, edge, text, hero, unlocking }: { id: string; tier: AwardTier; edge: string; text: FaceText; hero: boolean; unlocking: boolean }) {
  return (
    <g mask={unlocking ? `url(#${id}-roll)` : undefined}>
      <path d={edge} fill={`url(#${id}-foil)`} />
      <path d={edge} fill="none" stroke={FOIL.deep} strokeWidth="0.6" opacity="0.6" />
      <circle cx="60" cy="60" r="49.6" fill="none" stroke={FOIL.deep} strokeWidth="0.6" opacity="0.7" />
      <circle cx="60" cy="60" r="47" style={{ fill: tierInk(tier) }} filter={hero ? `url(#${id}-bite)` : undefined} />
      <g style={{ color: PAPER }}>
        <SealLines id={id} text={text} guilloche={hero} centerFill={tierInk(tier)} />
      </g>
      {unlocking ? (
        <g clipPath={`url(#${id}-clip)`}>
          <g className="md-glint">
            <rect x="-30" y="-20" width="16" height="160" fill="#fff" opacity="0.55" transform="rotate(24 60 60)" />
          </g>
        </g>
      ) : null}
    </g>
  );
}

/** Blind emboss: highlight up-left, shadow down-right, paper on top. */
function BlindSeal({ id, edge, text }: { id: string; edge: string; text: FaceText }) {
  const pass = (dx: number, color: string) => (
    <g transform={`translate(${dx} ${dx})`} style={{ color }}>
      <path d={edge} fill="currentColor" />
    </g>
  );
  const lines = (dx: number, color: string) => (
    <g transform={`translate(${dx} ${dx})`} style={{ color }}>
      <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <SealLines id={id} text={text} guilloche={false} />
    </g>
  );
  return (
    <g>
      {pass(0.9, "var(--md-lo)")}
      {pass(-0.7, "var(--md-hi)")}
      {pass(0, PAPER)}
      {lines(0.55, "var(--md-lo)")}
      {lines(-0.45, "var(--md-hi)")}
      {lines(0, PAPER)}
    </g>
  );
}

function SealSvg({ size, tier, edge, text, locked, unlocking, before }: { size: number; tier: AwardTier; edge: string; text: FaceText; locked: boolean; unlocking: boolean; before?: ReactNode }) {
  const id = useSvgId("sl");
  const hero = detailForSize(size) === "hero";
  return (
    <MarkSvg size={size}>
      <defs>
        <SealDefs id={id} />
        <clipPath id={`${id}-clip`}>
          <path d={edge} />
        </clipPath>
        {unlocking ? (
          <mask id={`${id}-roll`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
            {/* The ink roller: a white bar that grows left to right over the blind seal. */}
            <rect className="md-roll" width="120" height="120" fill="#fff" />
          </mask>
        ) : null}
      </defs>
      {before}
      {locked || unlocking ? <BlindSeal id={id} edge={edge} text={text} /> : null}
      {locked ? null : <InkedSeal id={id} tier={tier} edge={edge} text={text} hero={hero} unlocking={unlocking} />}
    </MarkSvg>
  );
}

function Numeral({ value }: { value: string }) {
  return (
    <text x="60" y="65" textAnchor="middle" className={T.mono} fontSize="14" fontWeight="500" fill="currentColor">
      {value}
    </text>
  );
}

export function SealMark({ rung, name, locked = false, size = 120, unlocking = false }: LevelMarkProps) {
  if (detailForSize(size) === "tiny") {
    return <TinySeal size={size} tier={rung.tier} locked={locked} edge={scallopPath(46, 16, 1.1)} center={<TinyNumeral value={String(rung.level)} />} />;
  }
  return (
    <SealSvg
      size={size}
      tier={rung.tier}
      edge={LEVEL_EDGE}
      locked={locked}
      unlocking={unlocking}
      text={{
        top: name.toUpperCase(),
        bottom: "GOALMAXXING · MMXXVI",
        center: <Numeral value={String(rung.level).padStart(2, "0")} />,
      }}
    />
  );
}

function TinyNumeral({ value }: { value: string }) {
  return (
    <text x="60" y="76" textAnchor="middle" className={T.mono} fontSize="44" fontWeight="500" fill="currentColor">
      {value}
    </text>
  );
}

function TinySeal({ tier, locked, edge, center, size = 20 }: { tier: AwardTier; locked: boolean; edge: string; center: ReactNode; size?: number }) {
  return (
    <MarkSvg size={size}>
      {locked ? (
        <g style={{ color: "var(--md-lo)" }}>
          <path d={edge} style={{ fill: PAPER }} stroke="currentColor" strokeWidth="5" />
          {center}
        </g>
      ) : (
        <>
          <path d={edge} fill={FOIL.mid} stroke={FOIL.deep} strokeWidth="3" />
          <circle cx="60" cy="60" r="37" style={{ fill: tierInk(tier) }} />
          <g style={{ color: PAPER }}>{center}</g>
        </>
      )}
    </MarkSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Future families: same press, different edge per family.              */
/* ------------------------------------------------------------------ */

const FAMILY_EDGE: Record<MedalFamilyKey, string> = {
  challenge: starPath(57, 50, 36),
  leaderboard: scallopPath(53, 30),
  streak: scallopPath(52, 12, 1.15),
  goal: scallopPath(53, 22, 0.8),
  team: starPath(56, 51, 6, 30),
};

const FAMILY_TOP: Record<MedalFamilyKey, string> = {
  challenge: "CHALLENGE",
  leaderboard: "WEEKLY BOARD",
  streak: "ON PLAN",
  goal: "ACHIEVED",
  team: "TEAM GOAL",
};

/** Award-rosette tails for leaderboard placings. */
function Tails({ tier }: { tier: AwardTier }) {
  return (
    <g style={{ fill: tierInk(tier) }}>
      <path d="M44 96 L32 119 L41 114 L46 121 L56 99 Z" />
      <path d="M76 96 L88 119 L79 114 L74 121 L64 99 Z" opacity="0.85" />
    </g>
  );
}

export function SealFamilyMark({ family, size = 96 }: FamilyMarkProps) {
  const key = family.key;
  const tier = FAMILY_TIER[key];
  if (detailForSize(size) === "tiny") {
    return <TinySeal size={size} tier={tier} locked={false} edge={FAMILY_EDGE[key]} center={<FamilyGlyph family={key} x={60} y={60} size={46} strokeWidth={7} />} />;
  }
  return (
    <SealSvg
      size={size}
      tier={tier}
      edge={FAMILY_EDGE[key]}
      locked={false}
      unlocking={false}
      before={key === "leaderboard" ? <Tails tier={tier} /> : null}
      text={{
        top: FAMILY_TOP[key],
        bottom: family.legend.toUpperCase(),
        center: <FamilyGlyph family={key} x={60} y={60} size={18} strokeWidth={1.4} />,
      }}
    />
  );
}
