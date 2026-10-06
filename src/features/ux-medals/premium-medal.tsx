"use client";

import type { CSSProperties, ReactNode, SVGProps } from "react";
import { MarkSvg, T } from "@/features/ux-medals/mark-kit";
import type { FormKey } from "@/features/ux-medals/model";
import {
  FORMS,
  premiumDetail,
  ringPath,
  shapeMask,
  type FormGeometry,
  type PremiumDetail,
  type PremiumForm,
} from "@/features/ux-medals/premium-forms";
import { finishVars, type FaceKind, type Finish, type Variant } from "@/features/ux-medals/premium-materials";
import { ticksPath, useSvgId } from "@/features/ux-medals/svg-geometry";

/*
 * One premium medal = CSS material layers + an SVG overlay, both on the same
 * 120-unit grid:
 *
 *   shadow · edge (side wall) · rim (polished conic bevel) · face (material)
 *   · SVG (enamel band, reeding, bevel strokes, engraved type) · sheen
 *   · [unlock: light sweep + rim catch-light]
 *
 * The CSS layers read the card's light variables (`cardOptics()`), so a
 * pointer-driven `LightStage` lights medals exactly the way it lights cards.
 */

/** Relief filters from the card-materials study, mounted once per page by `MedalsStage`. */
export const LETTERING_ID = "pm-letter";
const RECESSED = `url(#${LETTERING_ID}-recessed-text)`;
const RAISED = `url(#${LETTERING_ID}-raised-text)`;

export interface MedalCtx {
  id: string;
  variant: Variant;
  finish: Finish;
  detail: PremiumDetail;
  locked: boolean;
  geo: FormGeometry;
  rimIn: number;
  /** Machined enamel band inner edge; null when there is no band. */
  bandIn: number | null;
  paint: (name: "ink" | "enamel" | "clear" | "spectrum") => string;
}

export const isRich = (m: MedalCtx) => m.detail === "hero" || m.detail === "shelf";
export const isCompact = (m: MedalCtx) => m.detail === "small" || m.detail === "tiny";

/** Recessed track the enamel sits in; on a blank it stays empty. */
export const groove = (m: MedalCtx) => `color-mix(in srgb, ${m.finish.metal.lo} 62%, #000)`;

function faceKind(finish: Finish, geo: FormGeometry): FaceKind {
  // Lathe turning only makes sense on round stock.
  return finish.face === "turned" && !geo.circular ? "brushed" : finish.face;
}

const maskStyle = (d: string) => ({ "--pm-mask": shapeMask(d) }) as CSSProperties;

function Defs({ id, finish }: { id: string; finish: Finish }) {
  const [enamel, enamelLight] = finish.enamel;
  const stop = (offset: number, color: string, opacity = 1) => (
    <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
  );
  return (
    <defs>
      <linearGradient id={`${id}-ink`} x1="0" y1="0" x2="1" y2="1">
        {stop(0, finish.ink[0])}
        {stop(0.48, finish.ink[1])}
        {stop(1, finish.ink[2])}
      </linearGradient>
      <radialGradient id={`${id}-enamel`} gradientUnits="userSpaceOnUse" cx="38" cy="28" r="104">
        {stop(0, enamelLight)}
        {stop(0.5, enamel)}
        {stop(1, `color-mix(in srgb, ${enamel} 55%, #000)`)}
      </radialGradient>
      {/* Clear coat: a glossy top, slightly shaded underside. */}
      <linearGradient id={`${id}-clear`} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="116">
        {stop(0, "#fff", 0.6)}
        {stop(0.28, "#fff", 0.12)}
        {stop(0.5, "#fff", 0)}
        {stop(1, "#000", 0.2)}
      </linearGradient>
      {/* Raised chamfer: lit up-left, shaded down-right. */}
      <linearGradient id={`${id}-bev`} gradientUnits="userSpaceOnUse" x1="22" y1="8" x2="98" y2="112">
        {stop(0, "#fff", 0.95)}
        {stop(0.42, "#fff", 0)}
        {stop(0.6, "#000", 0)}
        {stop(1, "#000", 0.42)}
      </linearGradient>
      {/* Cut wall into a recess: the reverse. */}
      <linearGradient id={`${id}-cut`} gradientUnits="userSpaceOnUse" x1="22" y1="8" x2="98" y2="112">
        {stop(0, "#000", 0.45)}
        {stop(0.4, "#000", 0)}
        {stop(0.58, "#fff", 0)}
        {stop(1, "#fff", 0.85)}
      </linearGradient>
      <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(18 0.5 0.5)">
        {stop(0.4, finish.shine, 0)}
        {stop(0.5, finish.shine, 0.95)}
        {stop(0.6, finish.shine, 0)}
      </linearGradient>
      {finish.foil ? (
        <linearGradient id={`${id}-spectrum`} gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="106" y2="110">
          {stop(0, finish.foil[0])}
          {stop(0.35, finish.foil[1])}
          {stop(0.65, finish.foil[2])}
          {stop(1, finish.foil[3])}
        </linearGradient>
      ) : null}
    </defs>
  );
}

/** The default machined band: enamel with a clear coat, or an empty groove on a blank. */
function Band({ m }: { m: MedalCtx }) {
  const ring = ringPath(m.geo.path(m.rimIn), m.geo.path(m.bandIn!));
  if (m.locked) return <path d={ring} fillRule="evenodd" style={{ fill: groove(m) }} />;
  const mid = 56 - (m.rimIn + m.bandIn!) / 2;
  return (
    <g>
      <path d={ring} fillRule="evenodd" fill={m.paint(m.finish.foil ? "spectrum" : "enamel")} />
      {isRich(m) ? <path d={ring} fillRule="evenodd" fill={m.paint("clear")} /> : null}
      {/* Two polished studs set into the enamel, at three and nine o'clock. */}
      {m.detail === "hero" && m.geo.circular
        ? [60 - mid, 60 + mid].map((cx) => (
            <circle key={cx} cx={cx} cy={60} r={1.5} stroke={`url(#${m.id}-bev)`} strokeWidth={0.4} style={{ fill: m.finish.metal.hi }} />
          ))
        : null}
    </g>
  );
}

function Ornament({ m, band }: { m: MedalCtx; band?: (m: MedalCtx) => ReactNode }) {
  const { geo } = m;
  const hero = m.detail === "hero";
  const outer = geo.path(0);
  const contour = m.detail === "tiny" ? 4 : m.detail === "small" ? 2.2 : 0.9;
  return (
    <g>
      {m.detail !== "tiny" && band ? band(m) : m.bandIn !== null ? <Band m={m} /> : null}
      {m.variant === "prism" && isRich(m) ? (
        <path d={geo.path(m.rimIn + geo.table)} fill="none" strokeWidth={0.5} strokeOpacity={0.3} style={{ stroke: m.finish.type }} />
      ) : null}
      {/* Reeded rim, like the machined medallion in the objects study. */}
      {m.variant === "machined" && hero && geo.circular ? (
        <path d={ticksPath(56 - m.rimIn + 0.7, 55.3, 120)} fill="none" strokeWidth={0.45} strokeOpacity={0.4} style={{ stroke: m.finish.metal.lo }} />
      ) : null}
      {isRich(m) ? (
        <>
          <path d={outer} fill="none" stroke={`url(#${m.id}-bev)`} strokeWidth={hero ? 0.9 : 1.4} />
          <path d={geo.path(m.rimIn)} fill="none" stroke={`url(#${m.id}-cut)`} strokeWidth={hero ? 1 : 1.5} />
          {m.bandIn !== null ? (
            <path d={geo.path(m.bandIn)} fill="none" stroke={`url(#${m.id}-bev)`} strokeWidth={hero ? 0.8 : 1.2} />
          ) : null}
        </>
      ) : null}
      {/* A dark contour keeps the silhouette crisp on light paper at every size. */}
      <path d={outer} fill="none" strokeWidth={contour} strokeLinejoin="round" strokeOpacity={0.5} style={{ stroke: m.finish.metal.edge }} />
    </g>
  );
}

export interface PremiumMedalProps {
  variant: Variant;
  form: PremiumForm;
  family: FormKey;
  finish: Finish;
  size: number;
  locked: boolean;
  unlocking?: boolean;
  /** Hero only: the medal turns with the stage's pose, not just its light. */
  tilt?: boolean;
  /** Replaces the default band (streak week segments). */
  band?: (m: MedalCtx) => ReactNode;
  children: (m: MedalCtx) => ReactNode;
}

export function PremiumMedal({
  variant,
  form,
  family,
  finish,
  size,
  locked,
  unlocking = false,
  tilt = false,
  band,
  children,
}: PremiumMedalProps) {
  const id = useSvgId("pm");
  const detail = premiumDetail(size);
  const geo = FORMS[form];
  const base = variant === "machined" ? geo.rim : geo.bezel;
  const rimIn = detail === "tiny" ? geo.tinyRim : base;
  const bandIn = variant === "machined" && detail !== "tiny" ? geo.band : null;
  const m: MedalCtx = {
    id,
    variant,
    finish,
    detail,
    locked,
    geo,
    rimIn,
    bandIn,
    paint: (name) => `url(#${id}-${name})`,
  };
  const face = faceKind(finish, geo);
  const outer = geo.path(0);
  const inner = geo.path(rimIn);
  const lit = face !== "matte" && isRich(m);

  return (
    <span
      className="pm-medal"
      aria-hidden
      data-variant={variant}
      data-family={family}
      data-material={finish.key}
      data-detail={detail}
      data-face={face}
      data-tilt={tilt || undefined}
      data-unlocking={unlocking || undefined}
      style={{ width: size, height: size, ...finishVars(finish) }}
    >
      {isRich(m) ? <span className="pm-shadow" /> : null}
      <span className="pm-body">
        {detail === "tiny" ? null : <span className="pm-layer pm-edge" style={maskStyle(outer)} />}
        <span className="pm-layer pm-rim" style={maskStyle(outer)} />
        <span className="pm-layer pm-face" style={maskStyle(inner)}>
          {face === "gem" && isRich(m) ? <span className="pm-facets" /> : null}
        </span>
        <MarkSvg size={size} className="pm-art">
          <Defs id={id} finish={finish} />
          <Ornament m={m} band={band} />
          <g className="pm-type">{children(m)}</g>
        </MarkSvg>
        {lit ? <span className="pm-layer pm-sheen" style={maskStyle(outer)} /> : null}
        {unlocking ? (
          <>
            <span className="pm-layer pm-sweep" style={maskStyle(outer)} />
            <span className="pm-layer pm-catch" style={maskStyle(ringPath(outer, inner))} />
          </>
        ) : null}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Type on metal.                                                       */
/* ------------------------------------------------------------------ */

type Anchor = "start" | "middle" | "end";

/**
 * The numeral. Machined: engraved (recessed relief, cut to the card's numeral
 * gradient). Prism: foil standing proud (raised relief). Hero numerals carry
 * a glint clipped to the glyphs that follows the stage light. Compact sizes
 * are a solid, heavier figure; blanks are an outline.
 */
export function Numeral({
  m,
  value,
  y,
  size,
  x = 60,
  anchor = "middle",
}: {
  m: MedalCtx;
  value: string;
  y: number;
  size: number;
  x?: number;
  anchor?: Anchor;
}) {
  const compact = isCompact(m);
  const shown = compact ? value.replace(/^0(?=\d)/, "") : value;
  const text = (extra: SVGProps<SVGTextElement> = {}) => (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={m.detail === "tiny" ? 700 : compact ? 600 : 400}
      textAnchor={anchor}
      letterSpacing={-size * 0.05}
      className={T.sans}
      {...extra}
      style={{ fontVariantNumeric: "tabular-nums", ...extra.style }}
    >
      {shown}
    </text>
  );
  if (m.locked) {
    return compact
      ? text({ opacity: 0.75, style: { fill: m.finish.type } })
      : text({ fill: "none", strokeWidth: Math.max(0.5, size / 70), opacity: 0.7, style: { stroke: m.finish.type } });
  }
  if (compact) return text({ style: { fill: m.finish.type } });
  // The glint moves with the light, which re-runs the relief filter every frame:
  // hero only, so a lit shelf of thirty medals stays cheap.
  return (
    <g filter={m.variant === "machined" ? RECESSED : RAISED}>
      {text({ fill: m.paint("ink") })}
      {m.detail === "hero" ? (
        <>
          <clipPath id={`${m.id}-num`}>{text()}</clipPath>
          <g clipPath={`url(#${m.id}-num)`}>
            <rect className="pm-glint" x={-60} y={0} width={240} height={120} fill={`url(#${m.id}-glint)`} />
          </g>
        </>
      ) : null}
    </g>
  );
}

/** A short engraved rule under the numeral. */
export function Rule({ m, y, half = 6, x = 60 }: { m: MedalCtx; y: number; half?: number; x?: number }) {
  return <line x1={x - half} x2={x + half} y1={y} y2={y} strokeWidth={0.6} strokeOpacity={0.5} style={{ stroke: m.finish.type }} />;
}
