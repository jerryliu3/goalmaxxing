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

/** Radial ticks between two radii (reeded rims). */
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

/** Rounded rectangle as a path, so it can share stroke/draw animation with other shapes. */
export function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** Regular polygon; rotate 0 puts a vertex at twelve o'clock. */
export function polygonPath(r: number, sides: number, rotate = 0, cx = C, cy = C) {
  const points = Array.from({ length: sides }, (_, i) => polar(r, rotate + (360 / sides) * i, cx, cy));
  return `${points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ")} Z`;
}

/** Circle with `count` semicircular punches bitten into its edge, first at twelve o'clock. */
export function notchedCirclePath(r: number, count: number, notch: number, rotate = 0, cx = C, cy = C) {
  const half = (Math.asin(notch / r) * 180) / Math.PI;
  const at = (i: number) => rotate + (360 / count) * i;
  const [sx, sy] = polar(r, at(0) + half, cx, cy);
  let d = `M ${sx} ${sy}`;
  for (let i = 1; i <= count; i += 1) {
    const [ax, ay] = polar(r, at(i) - half, cx, cy);
    const [bx, by] = polar(r, at(i) + half, cx, cy);
    d += ` A ${r} ${r} 0 0 1 ${ax} ${ay} A ${notch} ${notch} 0 0 0 ${bx} ${by}`;
  }
  return `${d} Z`;
}

/** Arc segments around a ring, e.g. one per week of a streak. Returns one path per segment. */
export function segmentPaths(r: number, count: number, gapDeg: number, cx = C, cy = C) {
  const span = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const start = span * i + gapDeg / 2;
    const end = span * (i + 1) - gapDeg / 2;
    const [x1, y1] = polar(r, start, cx, cy);
    const [x2, y2] = polar(r, end, cx, cy);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  });
}

/** Greedy word wrap for SVG text, with an ellipsis when it runs out of lines. */
export function wrapLines(text: string, maxChars: number, maxLines = 2) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[.,;:]?$/, "")}…`;
  return kept;
}
