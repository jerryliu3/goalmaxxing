"use client";

import type { ReactNode } from "react";
import {
  ArcText,
  FAMILY_TIER,
  FamilyGlyph,
  InkFilter,
  MarkSvg,
  PencilFilter,
  T,
  type FamilyMarkProps,
  type LevelMarkProps,
} from "@/features/ux-medals/mark-kit";
import { stampDate, tierInk, type MedalFamilyKey } from "@/features/ux-medals/model";
import {
  bottomArc,
  detailForSize,
  polar,
  sparklePath,
  topArc,
  useSvgId,
  wavePath,
} from "@/features/ux-medals/svg-geometry";

/** Hand-struck stamps never land square; each rung keeps its own tilt. */
const TILT = [-7, 4, -3, 8, -5];
const WAVES = [-12, -6, 0, 6, 12];

export function PostmarkMark({ rung, name, locked = false, size = 120 }: LevelMarkProps) {
  const detail = detailForSize(size);
  if (detail === "tiny") {
    return (
      <MarkSvg size={size}>
        <g style={{ color: locked ? "var(--md-pencil)" : tierInk(rung.tier) }}>
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth={locked ? 6 : 11} strokeDasharray={locked ? "10 8" : undefined} />
          <text x="60" y="79" textAnchor="middle" className={T.mono} fontSize="54" fontWeight="500" fill="currentColor">
            {rung.level}
          </text>
        </g>
      </MarkSvg>
    );
  }
  return locked ? (
    <PencilGuide rung={rung} name={name} size={size} />
  ) : (
    <InkedStamp rung={rung} name={name} size={size} hero={detail === "hero"} />
  );
}

function InkedStamp({ rung, name, size, hero }: Required<Pick<LevelMarkProps, "rung" | "name" | "size">> & { hero: boolean }) {
  const id = useSvgId("pm");
  const tilt = TILT[rung.index] ?? 0;
  const level = String(rung.level).padStart(2, "0");
  return (
    <MarkSvg size={size}>
      <defs>
        <InkFilter id={`${id}-ink`} seed={rung.index + 2} rough={hero ? 1.3 : 0.8} />
        <mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <rect width="120" height="120" fill="#fff" />
          <circle cx="60" cy="60" r="43.5" fill="#000" />
        </mask>
        <path id={`${id}-top`} d={topArc(30.5)} />
        <path id={`${id}-bottom`} d={bottomArc(37.2)} />
      </defs>
      <g className="md-ink" style={{ color: tierInk(rung.tier) }} transform={`rotate(${tilt} 60 60)`} filter={`url(#${id}-ink)`}>
        {/* Misregistered second strike: the pad touched twice. */}
        <g opacity="0.2" transform="translate(1.3 -0.9)" fill="none" stroke="currentColor">
          <circle cx="60" cy="60" r="40" strokeWidth="2.4" />
          <circle cx="60" cy="60" r="27" strokeWidth="1.2" />
        </g>
        <g mask={`url(#${id}-cut)`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          {WAVES.map((dy) => (
            <path key={dy} d={wavePath(2, 118, 60 + dy, 2.2, 9)} />
          ))}
        </g>
        <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="60" cy="60" r="27" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <ArcText pathId={`${id}-top`} size={8.2} spacing={1.4}>
          {name.toUpperCase()}
        </ArcText>
        <ArcText pathId={`${id}-bottom`} size={6.4} spacing={2.1}>
          GOALMAXXING
        </ArcText>
        {[90, 270].map((deg) => {
          const [x, y] = polar(33.8, deg);
          return <path key={deg} d={sparklePath(x, y, 2.6)} fill="currentColor" />;
        })}
        <text x="60" y="47" textAnchor="middle" className={T.sans} fontSize="5.4" fontWeight="600" letterSpacing="1.6" fill="currentColor">
          LEVEL
        </text>
        <text x="60" y="67" textAnchor="middle" className={T.mono} fontSize="20" fontWeight="500" fill="currentColor">
          {level}
        </text>
        <path d="M47 71.5 H73" stroke="currentColor" strokeWidth="0.9" />
        <text x="60" y="79.5" textAnchor="middle" className={T.mono} fontSize="5.6" letterSpacing="0.6" fill="currentColor">
          {stampDate(rung.unlockedAt)}
        </text>
      </g>
    </MarkSvg>
  );
}

function PencilGuide({ rung, name, size }: Required<Pick<LevelMarkProps, "rung" | "name" | "size">>) {
  const id = useSvgId("pp");
  return (
    <MarkSvg size={size}>
      <defs>
        <PencilFilter id={`${id}-pencil`} seed={rung.index + 4} />
        <path id={`${id}-top`} d={topArc(30.5)} />
        <path id={`${id}-bottom`} d={bottomArc(37.6)} />
      </defs>
      <g style={{ color: "var(--md-pencil)" }} filter={`url(#${id}-pencil)`} fill="none" stroke="currentColor" strokeLinecap="round">
        {/* Two loose passes of the compass, as if sketched. */}
        <circle cx="60.4" cy="59.7" r="40" strokeWidth="0.8" />
        <circle cx="59.7" cy="60.4" r="40.5" strokeWidth="0.45" opacity="0.6" />
        <circle cx="60" cy="60" r="27" strokeWidth="0.6" strokeDasharray="2.4 2.2" />
        <path d="M10 19 V10 H19 M101 10 H110 V19 M110 101 V110 H101 M19 110 H10 V101" strokeWidth="0.7" />
        <ArcText pathId={`${id}-top`} size={9} spacing={0.6} weight={400} className={`${T.display} md-t-italic`}>
          {name}
        </ArcText>
        <ArcText pathId={`${id}-bottom`} size={6.4} spacing={0.5} weight={400} className={`${T.display} md-t-italic`}>
          not yet stamped
        </ArcText>
        <text x="60" y="47" textAnchor="middle" className={T.sans} fontSize="5.4" letterSpacing="1.6" fill="currentColor" stroke="none">
          LEVEL
        </text>
        <text x="60" y="68" textAnchor="middle" className={T.mono} fontSize="21" fontWeight="500" strokeWidth="0.55">
          {String(rung.level).padStart(2, "0")}
        </text>
        <path d="M49 74 H71" strokeWidth="0.5" strokeDasharray="1.6 1.6" />
      </g>
    </MarkSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Future families: each is a different kind of postal handstamp.        */
/* ------------------------------------------------------------------ */

const FAMILY_OUTLINE: Record<MedalFamilyKey, (tiny: boolean) => ReactNode> = {
  challenge: (tiny) => <rect x={tiny ? 8 : 14} y={tiny ? 20 : 30} width={tiny ? 104 : 92} height={tiny ? 80 : 60} rx={tiny ? 12 : 6} />,
  leaderboard: (tiny) => <ellipse cx="60" cy="60" rx={tiny ? 52 : 50} ry={tiny ? 42 : 36} />,
  streak: (tiny) => <circle cx="60" cy="60" r={tiny ? 50 : 44} />,
  goal: (tiny) => <rect x={tiny ? 6 : 10} y={tiny ? 26 : 38} width={tiny ? 108 : 100} height={tiny ? 68 : 44} rx="3" />,
  team: (tiny) => <path d={hexagon(tiny ? 52 : 46)} />,
};

function hexagon(r: number) {
  return `${[30, 90, 150, 210, 270, 330].map((deg, i) => `${i ? "L" : "M"} ${polar(r, deg).join(" ")}`).join(" ")} Z`;
}

const FAMILY_TILT: Record<MedalFamilyKey, number> = { challenge: -4, leaderboard: 3, streak: -2, goal: -8, team: 5 };

export function PostmarkFamilyMark({ family, size = 96 }: FamilyMarkProps) {
  const id = useSvgId("pf");
  const tiny = detailForSize(size) === "tiny";
  const key = family.key;
  return (
    <MarkSvg size={size}>
      {tiny ? null : (
        <defs>
          <InkFilter id={`${id}-ink`} seed={key.length + 3} rough={1} />
        </defs>
      )}
      <g
        className="md-ink"
        style={{ color: tierInk(FAMILY_TIER[key]) }}
        transform={`rotate(${FAMILY_TILT[key]} 60 60)`}
        filter={tiny ? undefined : `url(#${id}-ink)`}
        fill="none"
        stroke="currentColor"
        strokeWidth={tiny ? 9 : 2.4}
      >
        {FAMILY_OUTLINE[key](tiny)}
        {tiny ? (
          <FamilyGlyph family={key} x={60} y={60} size={54} strokeWidth={8} />
        ) : (
          <PostmarkFamilyFace family={family} />
        )}
      </g>
    </MarkSvg>
  );
}

function Label({ y, size, children, x = 60, anchor = "middle", mono = false, spacing = 1.4 }: { y: number; size: number; children: ReactNode; x?: number; anchor?: "middle" | "start"; mono?: boolean; spacing?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={mono ? T.mono : T.sans} fontSize={size} fontWeight={mono ? 500 : 700} letterSpacing={spacing} fill="currentColor" stroke="none">
      {children}
    </text>
  );
}

function PostmarkFamilyFace({ family }: { family: FamilyMarkProps["family"] }) {
  const legend = family.legend.toUpperCase();
  switch (family.key) {
    case "challenge":
      return (
        <>
          <rect x="18" y="34" width="84" height="52" rx="3" strokeWidth="0.9" />
          <FamilyGlyph family="challenge" x={34} y={60} size={22} strokeWidth={1.8} />
          <Label x={50} y={56} size={7} anchor="start" spacing={1}>COMPLETED</Label>
          <Label x={50} y={68} size={6.4} anchor="start" mono spacing={0.4}>{legend}</Label>
          <Label x={50} y={78} size={5} anchor="start" mono spacing={0.4}>WK 40 · 2026</Label>
        </>
      );
    case "leaderboard":
      return (
        <>
          <ellipse cx="60" cy="60" rx="44" ry="30" strokeWidth="0.9" />
          <Label y={44} size={5.6} spacing={1.6}>WEEKLY BOARD</Label>
          <text x="60" y="70" textAnchor="middle" className={T.display} fontSize="20" fontWeight="600" fill="currentColor" stroke="none">
            {family.legend}
          </text>
          <Label y={82} size={5.4} mono spacing={0.6}>WK 40</Label>
        </>
      );
    case "streak":
      return (
        <>
          <circle cx="60" cy="60" r="29" strokeWidth="1" />
          {Array.from({ length: 12 }, (_, i) => {
            const [x1, y1] = polar(33, i * 30);
            const [x2, y2] = polar(39, i * 30);
            return <path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} strokeWidth="2" strokeLinecap="round" />;
          })}
          <Label y={48} size={5} spacing={1.4}>ON PLAN</Label>
          <Label y={67} size={20} mono spacing={0}>12</Label>
          <Label y={77} size={5.4} spacing={1.8}>WEEKS</Label>
        </>
      );
    case "goal":
      return (
        <>
          <Label y={62} size={13.5} spacing={2}>ACHIEVED</Label>
          <path d="M18 67 H102" strokeWidth="0.8" />
          <Label y={76} size={5.8} mono spacing={0.8}>{legend}</Label>
        </>
      );
    case "team":
      return (
        <>
          <path d={hexagon(40)} strokeWidth="0.9" />
          <Label y={37} size={5.4} spacing={2}>TEAM</Label>
          <FamilyGlyph family="team" x={60} y={56} size={26} strokeWidth={1.8} />
          <Label y={80} size={7} spacing={1.2}>{legend}</Label>
        </>
      );
  }
}
