"use client";

import type { ReactNode } from "react";
import type { AwardTier } from "@/features/achievements/types";
import {
  ArcText,
  FAMILY_TIER,
  FamilyGlyph,
  MarkSvg,
  PencilFilter,
  T,
  type FamilyMarkProps,
  type LevelMarkProps,
} from "@/features/ux-medals/mark-kit";
import { romanNumeral, tierInk, type MedalFamilyKey } from "@/features/ux-medals/model";
import {
  bottomArc,
  detailForSize,
  polar,
  sparklePath,
  ticksPath,
  topArc,
  useSvgId,
} from "@/features/ux-medals/svg-geometry";

const REEDS = ticksPath(52.5, 56, 96);
const TINY_REEDS = ticksPath(43, 53, 28);
const BEADS = Array.from({ length: 64 }, (_, i) => polar(49.2, (360 / 64) * i));
const HATCH = Array.from({ length: 31 }, (_, i) => `M 24 ${26.5 + i * 2.25} H 96`).join(" ");
const RUBBING = Array.from({ length: 44 }, (_, i) => `M ${-20 + i * 3.6} 120 L ${40 + i * 3.6} 0`).join(" ");

const face = (tier: AwardTier) => `color-mix(in srgb, ${tierInk(tier)} 13%, var(--md-paper))`;

/** Two laurel sprigs rising from the base of the field. */
function Laurel({ faceFill }: { faceFill?: string }) {
  const leaves: ReactNode[] = [];
  for (const side of [1, -1]) {
    for (let i = 0; i < 4; i += 1) {
      const deg = 180 - side * (12 + i * 14);
      for (const [r, tilt] of [
        [29.5, 28],
        [24.5, -28],
      ] as const) {
        const [x, y] = polar(r, deg);
        leaves.push(
          <ellipse
            key={`${side}-${i}-${r}`}
            cx={x}
            cy={y}
            rx="3.6"
            ry="1.45"
            transform={`rotate(${deg + side * tilt} ${x} ${y})`}
            style={faceFill ? { fill: faceFill } : undefined}
            fill="none"
          />
        );
      }
    }
  }
  const [rx1, ry1] = polar(27, 172);
  const [rx2, ry2] = polar(27, 118);
  const [lx1, ly1] = polar(27, 188);
  const [lx2, ly2] = polar(27, 242);
  return (
    <g strokeWidth="0.6">
      <path d={`M ${rx1} ${ry1} A 27 27 0 0 0 ${rx2} ${ry2} M ${lx1} ${ly1} A 27 27 0 0 1 ${lx2} ${ly2}`} fill="none" />
      {leaves}
    </g>
  );
}

function CoinFrame({
  id,
  tier,
  top,
  bottom,
  locked,
  center,
}: {
  id: string;
  tier: AwardTier;
  top: string;
  bottom: string;
  locked: boolean;
  center: ReactNode;
}) {
  const faceFill = locked ? undefined : face(tier);
  return (
    <>
      <defs>
        <clipPath id={`${id}-field`}>
          <circle cx="60" cy="60" r="34" />
        </clipPath>
        <clipPath id={`${id}-coin`}>
          <circle cx="60" cy="60" r="56" />
        </clipPath>
        <path id={`${id}-top`} d={topArc(38.5)} />
        <path id={`${id}-bottom`} d={bottomArc(45.2)} />
        {locked ? <PencilFilter id={`${id}-pencil`} seed={top.length} /> : null}
      </defs>
      <g
        style={{ color: locked ? "var(--md-pencil)" : tierInk(tier) }}
        stroke="currentColor"
        fill="none"
        filter={locked ? `url(#${id}-pencil)` : undefined}
      >
        {locked ? (
          /* A graphite rubbing: diagonal strokes everywhere, relief pressed darker. */
          <path d={RUBBING} clipPath={`url(#${id}-coin)`} strokeWidth="0.5" opacity="0.32" />
        ) : null}
        <circle cx="60" cy="60" r="56" strokeWidth="1.4" style={faceFill ? { fill: faceFill } : undefined} />
        <path d={REEDS} strokeWidth="0.7" />
        <circle cx="60" cy="60" r="52.5" strokeWidth="1" />
        {BEADS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.85" fill="currentColor" stroke="none" />
        ))}
        <ArcText pathId={`${id}-top`} size={7.4} spacing={1.8} weight={600} className={T.display}>
          {top}
        </ArcText>
        <ArcText pathId={`${id}-bottom`} size={5.4} spacing={1.6}>
          {bottom}
        </ArcText>
        {[90, 270].map((deg) => {
          const [x, y] = polar(41.6, deg);
          return <path key={deg} d={sparklePath(x, y, 2.2)} fill="currentColor" stroke="none" />;
        })}
        <circle cx="60" cy="60" r="35.5" strokeWidth="1.1" />
        <circle cx="60" cy="60" r="34" strokeWidth="0.4" />
        {locked ? null : <path d={HATCH} clipPath={`url(#${id}-field)`} strokeWidth="0.4" opacity="0.45" />}
        <Laurel faceFill={faceFill} />
        <circle cx="60" cy="40" r="6.6" stroke="none" style={faceFill ? { fill: faceFill } : undefined} />
        <path d={sparklePath(60, 40, 5.4, 0.3)} fill="currentColor" stroke="none" />
        <ellipse cx="60" cy="60" rx="25" ry="13.5" strokeWidth="0.9" style={faceFill ? { fill: faceFill } : undefined} />
        <ellipse cx="60" cy="60" rx="23" ry="11.5" strokeWidth="0.35" />
        {center}
      </g>
    </>
  );
}

function TinyCoin({ tier, locked, size, children }: { tier: AwardTier; locked: boolean; size: number; children: ReactNode }) {
  return (
    <MarkSvg size={size}>
      <g style={{ color: locked ? "var(--md-pencil)" : tierInk(tier) }} stroke="currentColor" fill="none">
        <circle cx="60" cy="60" r="53" strokeWidth="5" strokeDasharray={locked ? "8 6" : undefined} style={locked ? undefined : { fill: face(tier) }} />
        <path d={TINY_REEDS} strokeWidth="3.5" />
        {children}
      </g>
    </MarkSvg>
  );
}

export function CoinMark({ rung, name, locked = false, size = 120 }: LevelMarkProps) {
  const id = useSvgId("cn");
  if (detailForSize(size) === "tiny") {
    return (
      <TinyCoin tier={rung.tier} locked={locked} size={size}>
        <text x="60" y="77" textAnchor="middle" className={T.display} fontSize="50" fontWeight="600" fill="currentColor" stroke="none">
          {rung.level}
        </text>
      </TinyCoin>
    );
  }
  const numeral = romanNumeral(rung.level);
  return (
    <MarkSvg size={size}>
      <CoinFrame
        id={id}
        tier={rung.tier}
        locked={locked}
        top={`ONE ${name.toUpperCase()}`}
        bottom={locked ? "NOT YET MINTED" : "GOALMAXXING · MMXXVI"}
        center={
          <text
            x="60"
            y="66.5"
            textAnchor="middle"
            className={T.display}
            fontSize={numeral.length > 3 ? 16 : 19}
            fontWeight="600"
            letterSpacing="1"
            fill="currentColor"
            stroke="none"
          >
            {numeral}
          </text>
        }
      />
    </MarkSvg>
  );
}

const FAMILY_TOP: Record<MedalFamilyKey, string> = {
  challenge: "CHALLENGE",
  leaderboard: "WEEKLY BOARD",
  streak: "ON PLAN",
  goal: "ACHIEVED",
  team: "TEAM GOAL",
};

export function CoinFamilyMark({ family, size = 96 }: FamilyMarkProps) {
  const id = useSvgId("cf");
  const tier = FAMILY_TIER[family.key];
  if (detailForSize(size) === "tiny") {
    return (
      <TinyCoin tier={tier} locked={false} size={size}>
        <FamilyGlyph family={family.key} x={60} y={60} size={50} strokeWidth={7} />
      </TinyCoin>
    );
  }
  return (
    <MarkSvg size={size}>
      <CoinFrame
        id={id}
        tier={tier}
        locked={false}
        top={FAMILY_TOP[family.key]}
        bottom={family.legend.toUpperCase()}
        center={<FamilyGlyph family={family.key} x={60} y={60} size={18} strokeWidth={1.3} />}
      />
    </MarkSvg>
  );
}
