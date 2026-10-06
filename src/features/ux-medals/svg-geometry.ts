import { useId } from "react";

/** All marks draw on a 120-unit square so stroke weights stay comparable. */
export const VIEW = 120;
export const C = 60;

export type MarkDetail = "hero" | "shelf" | "tiny";

/** Level of detail by rendered size: text and fine lines drop out as the mark shrinks. */
export function detailForSize(size: number): MarkDetail {
  if (size >= 120) return "hero";
  if (size >= 44) return "shelf";
  return "tiny";
}

/** SVG-safe unique id; React's useId contains characters that break `url(#…)`. */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** Polar point with 0° at twelve o'clock, increasing clockwise. */
export function polar(r: number, deg: number, cx = C, cy = C): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [round(cx + r * Math.cos(rad)), round(cy + r * Math.sin(rad))];
}

/**
 * Half-circle baselines for <textPath>. Top text runs over the arc with glyphs
 * rising outward; bottom text runs under it with glyphs rising toward the
 * centre, so both read upright. Place top baselines on the inner edge of a band
 * and bottom baselines on its outer edge.
 */
export function topArc(r: number, cx = C, cy = C) {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
}

export function bottomArc(r: number, cx = C, cy = C) {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
}

/** Scalloped rosette edge: `count` outward bumps around radius `r`. */
export function scallopPath(r: number, count: number, bulge = 1, cx = C, cy = C) {
  const chord = 2 * r * Math.sin(Math.PI / count);
  const bump = round((chord / 2) * bulge);
  let d = "";
  for (let i = 0; i <= count; i += 1) {
    const [x, y] = polar(r, (360 / count) * i, cx, cy);
    d += i === 0 ? `M ${x} ${y}` : ` A ${bump} ${bump} 0 0 1 ${x} ${y}`;
  }
  return `${d} Z`;
}

/** Alternating-radius star / serrated edge. */
export function starPath(outer: number, inner: number, points: number, rotate = 0, cx = C, cy = C) {
  const step = 180 / points;
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const [x, y] = polar(i % 2 === 0 ? outer : inner, rotate + step * i, cx, cy);
    parts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  return `${parts.join(" ")} Z`;
}

/** Radial ticks between two radii (reeded coin edges, dial marks). */
export function ticksPath(r1: number, r2: number, count: number, cx = C, cy = C) {
  let d = "";
  for (let i = 0; i < count; i += 1) {
    const deg = (360 / count) * i;
    const [x1, y1] = polar(r1, deg, cx, cy);
    const [x2, y2] = polar(r2, deg, cx, cy);
    d += `M ${x1} ${y1} L ${x2} ${y2} `;
  }
  return d.trim();
}

/** A horizontal sine-ish wave built from quadratic segments (postal cancels). */
export function wavePath(x0: number, x1: number, y: number, amp: number, wavelength: number) {
  const half = wavelength / 2;
  let d = `M ${x0} ${y}`;
  let x = x0;
  let up = true;
  while (x < x1) {
    const next = Math.min(x + half, x1);
    d += ` Q ${round((x + next) / 2)} ${round(up ? y - amp : y + amp)} ${round(next)} ${y}`;
    x = next;
    up = !up;
  }
  return d;
}

const guillocheCache = new Map<string, string>();

/**
 * Epitrochoid rosette for guilloché fields. Deterministic and cached, so every
 * instance of the same seal shares one path string.
 */
export function guillochePath(R: number, r: number, d: number, samples = 540, cx = C, cy = C) {
  const key = `${R}:${r}:${d}:${samples}:${cx}:${cy}`;
  const cached = guillocheCache.get(key);
  if (cached) return cached;
  const turns = r / gcd(Math.round(R * 10), Math.round(r * 10)) * 10;
  const total = Math.PI * 2 * turns;
  const points: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = (total * i) / samples;
    const x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
    const y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
    points.push(`${i === 0 ? "M" : "L"} ${round(cx + x)} ${round(cy + y)}`);
  }
  const path = `${points.join(" ")} Z`;
  guillocheCache.set(key, path);
  return path;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Four-point sparkle used for stars across directions. */
export function sparklePath(cx: number, cy: number, r: number, waist = 0.28) {
  return starPath(r, r * waist, 4, 0, cx, cy);
}
