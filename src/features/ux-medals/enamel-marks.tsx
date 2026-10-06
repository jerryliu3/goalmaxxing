"use client";

import type { AwardTier } from "@/features/achievements/types";
import {
  FAMILY_TIER,
  FamilyGlyph,
  MarkSvg,
  T,
  type FamilyMarkProps,
  type LevelMarkProps,
} from "@/features/ux-medals/mark-kit";
import { BRONZE, FOIL, type MedalFamilyKey } from "@/features/ux-medals/model";
import { GAZETTEER, GAZETTEER_HEATMAP_SCALE } from "@/lib/brand/gazetteer";
import { detailForSize, polar, sparklePath, ticksPath, useSvgId } from "@/features/ux-medals/svg-geometry";

/** Physical enamel colours: they do not change with the screen theme. */
const ENAMEL = {
  paper: GAZETTEER.paper,
  pale: GAZETTEER_HEATMAP_SCALE[0],
  clay: GAZETTEER.stampLight,
  rust: GAZETTEER.colRust,
  stamp: GAZETTEER.stamp,
  sage: GAZETTEER.sage,
  pine: GAZETTEER.gain,
  ochre: "#d0a148",
  night: "#2b241c",
} as const;

type Enamel = keyof typeof ENAMEL;

/** Tier is the plating, not the colour of the picture. */
const PLATING: Record<AwardTier, string> = {
  bronze: BRONZE,
  copper: GAZETTEER.stampLight,
  sage: "#a3aca5",
  gold: FOIL.mid,
  ink: "#3b342c",
};

const BLANK = "color-mix(in srgb, var(--md-muted) 16%, var(--md-paper))";

interface Cell {
  d: string;
  fill: Enamel;
}

interface Scene {
  field: Enamel;
  cells: Cell[];
  /** Metal-only lines (cloison wires that hold no enamel). */
  wires?: string;
  tiny: Cell[];
}

const CY = 58;
const tri = (a: [number, number], b: [number, number], c: [number, number]) =>
  `M ${a.join(" ")} L ${b.join(" ")} L ${c.join(" ")} Z`;
const ring = (r1: number, r2: number) =>
  [r1, r2].map((r) => `M ${60 - r} ${CY} A ${r} ${r} 0 1 0 ${60 + r} ${CY} A ${r} ${r} 0 1 0 ${60 - r} ${CY} Z`).join(" ");

function facetedStar(cx: number, cy: number, long: number, waist: number, light: Enamel, shade: Enamel): Cell[] {
  return [0, 90, 180, 270].flatMap((deg) => {
    const tip = polar(long, deg, cx, cy);
    return [
      { d: tri([cx, cy], tip, polar(waist, deg - 45, cx, cy)), fill: light },
      { d: tri([cx, cy], tip, polar(waist, deg + 45, cx, cy)), fill: shade },
    ];
  });
}

const SCENES: readonly Scene[] = [
  {
    field: "night",
    cells: [
      ...[[36, 36, 3.2], [82, 30, 2.6], [88, 50, 2], [30, 54, 2.2]].map(([x, y, r]) => ({ d: sparklePath(x!, y!, r!), fill: "paper" as const })),
      { d: "M10 76 Q60 64 110 76 V110 H10 Z", fill: "pine" },
      { d: "M40 78 L78 67 L80.5 72.5 L42.5 83.5 Z", fill: "clay" },
      { d: "M42 67 L80 78 L77.5 83.5 L39.5 72.5 Z", fill: "stamp" },
      { d: "M60 30 C69 41 75 51 69 63 C65 70 55 70 51 63 C46 55 50 46 55 42 C55 49 57 52 59.5 53.5 C57.5 46 57 38 60 30 Z", fill: "rust" },
      { d: "M61 48 C66 54 66.5 61 61.5 65 C57 63.5 55.5 58 58.5 54 C59.5 56 60.5 56.5 61 55.5 C60.2 53 60.3 50.5 61 48 Z", fill: "ochre" },
    ],
    tiny: [
      { d: "M10 80 Q60 70 110 80 V110 H10 Z", fill: "pine" },
      { d: "M60 22 C76 40 82 58 72 74 C66 82 54 82 48 74 C40 62 46 48 54 42 C54 52 57 56 60 58 C57 46 56 34 60 22 Z", fill: "rust" },
    ],
  },
  {
    field: "paper",
    cells: [
      { d: ring(34, 28), fill: "sage" },
      ...[45, 135, 225, 315].flatMap((deg) => [
        { d: tri([60, CY], polar(19, deg, 60, CY), polar(5, deg - 45, 60, CY)), fill: "ochre" as const },
        { d: tri([60, CY], polar(19, deg, 60, CY), polar(5, deg + 45, 60, CY)), fill: "clay" as const },
      ]),
      ...facetedStar(60, CY, 31, 6, "rust", "night"),
      { d: `M 56.8 ${CY} A 3.2 3.2 0 1 0 63.2 ${CY} A 3.2 3.2 0 1 0 56.8 ${CY} Z`, fill: "paper" },
    ],
    wires: ticksPath(28, 34, 16, 60, CY),
    tiny: [{ d: sparklePath(60, CY, 40, 0.22), fill: "rust" }],
  },
  {
    field: "pale",
    cells: [
      { d: "M71 40 A9 9 0 1 0 89 40 A9 9 0 1 0 71 40 Z", fill: "ochre" },
      { d: "M14 80 L40 46 L54 62 L72 42 L106 80 Z", fill: "sage" },
      { d: "M72 42 L65.7 49 L69 47.8 L72 51 L75 48 L78.3 49 Z", fill: "paper" },
      { d: "M26 86 L58 50 L92 86 Z", fill: "pine" },
      { d: "M58 50 L50.5 58.5 L55 57 L58 61 L61.5 56.5 L66 58.5 Z", fill: "paper" },
      { d: "M10 80 Q40 74 60 80 T110 78 V110 H10 Z", fill: "stamp" },
    ],
    tiny: [
      { d: "M70 38 A11 11 0 1 0 92 38 A11 11 0 1 0 70 38 Z", fill: "ochre" },
      { d: "M14 92 L54 34 L98 92 Z", fill: "pine" },
    ],
  },
  {
    field: "pale",
    cells: [
      { d: "M57 34 L18 24 L18 44 Z", fill: "ochre" },
      { d: "M63 34 L102 26 L102 46 Z", fill: "ochre" },
      { d: "M10 78 Q35 74 60 78 T110 78 V110 H10 Z", fill: "sage" },
      { d: "M42 86 Q50 74 60 75 Q71 74 78 86 Z", fill: "night" },
      { d: "M54 40 L66 40 L66.79 50 L53.21 50 Z", fill: "rust" },
      { d: "M53.21 50 L66.79 50 L67.58 60 L52.42 60 Z", fill: "paper" },
      { d: "M52.42 60 L67.58 60 L68.37 70 L51.63 70 Z", fill: "rust" },
      { d: "M51.63 70 L68.37 70 L69 78 L51 78 Z", fill: "paper" },
      { d: "M52 38 H68 V40.5 H52 Z", fill: "night" },
      { d: "M55 30 H65 V38 H55 Z", fill: "ochre" },
      { d: "M53.5 30 L60 23 L66.5 30 Z", fill: "rust" },
    ],
    wires: "M20 82 Q31 79.5 42 82 M80 82 Q91 79.5 102 82",
    tiny: [
      { d: "M53 40 L67 40 L71 86 L49 86 Z", fill: "rust" },
      { d: "M54 24 H66 V40 H54 Z", fill: "ochre" },
    ],
  },
  {
    field: "night",
    cells: [
      { d: "M10 84 Q60 68 110 84 V110 H10 Z", fill: "pine" },
      ...[[32, 36, 3], [88, 30, 2.6], [86, 62, 2.2], [32, 62, 2]].map(([x, y, r]) => ({ d: sparklePath(x!, y!, r!), fill: "paper" as const })),
      ...facetedStar(60, 48, 28, 6.5, "ochre", "paper"),
    ],
    tiny: [{ d: sparklePath(60, CY, 40, 0.24), fill: "ochre" }],
  },
];

const RIBBON = {
  band: "M10 86 Q60 80 110 86 L110 100 Q60 94 10 100 Z",
  left: "M14 89 L2 91 L7 96.5 L2 102 L16 100.5 Z",
  right: "M106 89 L118 91 L113 96.5 L118 102 L104 100.5 Z",
  text: "M14 95.6 Q60 89.6 106 95.6",
};

const paint = (fill: Enamel, locked: boolean) => ({ fill: locked ? BLANK : ENAMEL[fill] });

export function EnamelMark({ rung, name, locked = false, size = 120, unlocking = false }: LevelMarkProps) {
  const id = useSvgId("en");
  const scene = SCENES[rung.index] ?? SCENES[0]!;
  const detail = detailForSize(size);
  const metal = locked ? "var(--md-muted)" : PLATING[rung.tier];
  const tiny = detail === "tiny";
  const cells = tiny ? scene.tiny : scene.cells;

  return (
    <MarkSvg size={size}>
      <defs>
        <clipPath id={`${id}-field`}>
          <circle cx="60" cy={CY} r="42.5" />
        </clipPath>
        {tiny ? null : <path id={`${id}-ribbon`} d={RIBBON.text} />}
      </defs>
      {locked ? null : <circle cx="61.5" cy={CY + 3} r="47" fill="#000" opacity="0.16" />}
      <g clipPath={`url(#${id}-field)`} style={{ stroke: metal }} strokeWidth={tiny ? 4 : locked ? 1.1 : 1.8} strokeLinejoin="round">
        <circle cx="60" cy={CY} r="43" style={paint(scene.field, locked)} className={unlocking ? "md-cell" : undefined} />
        {cells.map((cell, index) => (
          <path
            key={index}
            d={cell.d}
            style={{ ...paint(cell.fill, locked), animationDelay: unlocking ? `${120 + index * 70}ms` : undefined }}
            className={unlocking ? "md-cell" : undefined}
          />
        ))}
        {scene.wires && !tiny ? <path d={scene.wires} fill="none" /> : null}
      </g>
      <circle cx="60" cy={CY} r="44.75" fill="none" style={{ stroke: metal }} strokeWidth={tiny ? 9 : locked ? 3 : 4.5} />
      {locked || tiny ? null : (
        <g fill="none" strokeLinecap="round">
          <circle cx="60" cy={CY} r="47" stroke={GAZETTEER.ink} strokeOpacity="0.25" strokeWidth="0.6" />
          <path d="M28 40 A36 36 0 0 1 48 24" stroke="#fff" strokeWidth="3" className={unlocking ? "md-gloss" : undefined} opacity="0.4" />
          <circle cx="25.5" cy="46" r="1.2" fill="#fff" stroke="none" opacity="0.4" />
        </g>
      )}
      {tiny ? null : (
        <g style={{ stroke: metal }} strokeWidth={locked ? 1.1 : 1.6} strokeLinejoin="round">
          <path d={RIBBON.left} style={{ fill: locked ? BLANK : ENAMEL.stamp }} />
          <path d={RIBBON.right} style={{ fill: locked ? BLANK : ENAMEL.stamp }} />
          <path d={RIBBON.band} style={{ fill: locked ? BLANK : ENAMEL.paper }} />
          {detail === "hero" ? (
            <text className={T.sans} fontSize="7.5" fontWeight="700" letterSpacing="1.6" stroke="none" style={{ fill: locked ? "var(--md-muted)" : ENAMEL.night }}>
              <textPath href={`#${id}-ribbon`} startOffset="50%" textAnchor="middle">
                {name.toUpperCase()}
              </textPath>
            </text>
          ) : null}
        </g>
      )}
    </MarkSvg>
  );
}

/* ------------------------------------------------------------------ */
/* Future families: one die-cut silhouette per family, glyph struck in metal. */
/* ------------------------------------------------------------------ */

const FAMILY_PIN: Record<MedalFamilyKey, { shape: string; fill: Enamel; second?: { shape: string; fill: Enamel } }> = {
  challenge: { shape: "M60 10 L102 24 V58 C102 84 84 100 60 110 C36 100 18 84 18 58 V24 Z", fill: "rust" },
  leaderboard: { shape: "M60 12 A48 48 0 1 0 60.01 12 Z", fill: "ochre" },
  streak: { shape: "M22 14 H98 A10 10 0 0 1 108 24 V96 A10 10 0 0 1 98 106 H22 A10 10 0 0 1 12 96 V24 A10 10 0 0 1 22 14 Z", fill: "sage" },
  goal: { shape: "M8 98 L44 28 L60 52 L74 36 L112 98 Z", fill: "pine" },
  team: {
    shape: "M44 22 A38 38 0 1 0 44.01 22 Z",
    fill: "clay",
    second: { shape: "M76 22 A38 38 0 1 0 76.01 22 Z", fill: "pine" },
  },
};

export function EnamelFamilyMark({ family, size = 96 }: FamilyMarkProps) {
  const pin = FAMILY_PIN[family.key];
  const metal = PLATING[FAMILY_TIER[family.key]];
  const tiny = detailForSize(size) === "tiny";
  const wire = tiny ? 7 : 3.5;
  const glyphY = family.key === "goal" ? 74 : 60;
  return (
    <MarkSvg size={size}>
      {tiny ? null : <path d={pin.shape} transform="translate(1.5 3)" fill="#000" opacity="0.16" />}
      <g style={{ stroke: metal }} strokeWidth={wire} strokeLinejoin="round">
        <path d={pin.shape} fill={ENAMEL[pin.fill]} />
        {pin.second ? <path d={pin.second.shape} fill={ENAMEL[pin.second.fill]} fillOpacity="0.92" /> : null}
      </g>
      <g style={{ color: family.key === "leaderboard" ? ENAMEL.night : ENAMEL.paper }}>
        <FamilyGlyph family={family.key} x={60} y={glyphY} size={tiny ? 54 : 40} strokeWidth={tiny ? 8 : 3.2} />
      </g>
      {tiny ? null : <path d="M30 32 Q36 22 48 18" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.6" strokeLinecap="round" />}
    </MarkSvg>
  );
}
