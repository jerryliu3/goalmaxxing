import { getRewardProgress } from "./reassembly-progress";

export const MAX_REWARD_PIECES = 24;
export type PiecePoint = { x: number; y: number };
export interface RewardPiece {
  id: number;
  points: PiecePoint[];
  clipPath: string;
  earnedAt: number;
  throwX: number;
  throwY: number;
  turn: number;
}

export function polygonArea(points: PiecePoint[]): number {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
}

function center(points: PiecePoint[]): PiecePoint {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

/** Direction from the finished card's center for preview-only shattering. */
export function pieceScatter(piece: Pick<RewardPiece, "points">) {
  const centroid = center(piece.points);
  return {
    x: (centroid.x - 50) * 0.85,
    y: (centroid.y - 50) * 0.85,
  };
}

/** Clip a convex polygon to one side of a line through its interior. */
function clipHalf(points: PiecePoint[], origin: PiecePoint, nx: number, ny: number): PiecePoint[] {
  const result: PiecePoint[] = [];
  const distance = (point: PiecePoint) => (point.x - origin.x) * nx + (point.y - origin.y) * ny;
  for (let index = 0; index < points.length; index++) {
    const from = points[index];
    const to = points[(index + 1) % points.length];
    const a = distance(from);
    const b = distance(to);
    if (a >= 0) result.push(from);
    if ((a >= 0) !== (b >= 0)) {
      const fraction = a / (a - b);
      result.push({ x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction });
    }
  }
  return result;
}

/** Inset toward the centroid so adjacent shards keep a hairline gap. */
export function insetPolygonPoints(points: PiecePoint[], count: number): PiecePoint[] {
  const middle = center(points);
  const inset = count === 1 ? 0 : 0.22;
  return points.map((point) => {
    const length = Math.hypot(middle.x - point.x, middle.y - point.y);
    const scale = length === 0 ? 0 : inset / length;
    return {
      x: point.x + (middle.x - point.x) * scale,
      y: point.y + (middle.y - point.y) * scale,
    };
  });
}

/** objectBoundingBox coordinates for an SVG clipPath (0–1). */
export function boundingBoxPoints(points: PiecePoint[]): string {
  return points
    .map((point) => `${(point.x / 100).toFixed(6)} ${(point.y / 100).toFixed(6)}`)
    .join(" ");
}

function fragmentClip(points: PiecePoint[], count: number): string {
  return `polygon(${insetPolygonPoints(points, count).map((point) => {
    return `${point.x.toFixed(4)}% ${point.y.toFixed(4)}%`;
  }).join(", ")})`;
}

/** Exact piece count; no random layout changes when the preview advances. */
export function buildRewardPieces(target: number): RewardPiece[] {
  const { required } = getRewardProgress(0, target);
  const count = Math.min(required, MAX_REWARD_PIECES);
  const polygons: PiecePoint[][] = [[{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]];
  while (polygons.length < count) {
    let largest = 0;
    for (let index = 1; index < polygons.length; index++) {
      if (polygonArea(polygons[index]) > polygonArea(polygons[largest])) largest = index;
    }
    const points = polygons[largest];
    const width = Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x));
    const height = Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y));
    const slope = ((polygons.length * 7) % 11 - 5) / 14;
    const [nx, ny] = width * 0.86 > height ? [1, slope] : [slope, 1];
    const origin = center(points);
    polygons.splice(largest, 1, clipHalf(points, origin, nx, ny), clipHalf(points, origin, -nx, -ny));
  }

  // Scatter the arrival order spatially; it should not read as a filling bar.
  return polygons.map((points, index) => ({ points, order: ((index + 1) * 2654435761) >>> 0 }))
    .sort((a, b) => a.order - b.order)
    .map(({ points }, index) => ({
      id: index,
      points,
      clipPath: fragmentClip(points, count),
      // Rounded groups cover the full target; the last piece never arrives early.
      earnedAt: Math.ceil((index + 1) * required / count),
      throwX: (index % 2 === 0 ? -1 : 1) * (90 + index % 3 * 28),
      throwY: -120 - index % 4 * 22,
      turn: (index % 2 === 0 ? -1 : 1) * (18 + index % 3 * 9),
    }));
}
