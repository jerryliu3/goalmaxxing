import { describe, expect, it } from "vitest";
import { buildRewardPieces, MAX_REWARD_PIECES, polygonArea } from "./reward-pieces";

describe("reward fragments", () => {
  it.each([1, 2, 6, 12, 17, 24, 25, 60, 120, 365])("partitions the whole card deterministically for a target of %i", target => {
    const pieces = buildRewardPieces(target);
    expect(pieces).toHaveLength(Math.min(target, MAX_REWARD_PIECES));
    expect(buildRewardPieces(target)).toEqual(pieces);
    expect(pieces.reduce((sum, piece) => sum + polygonArea(piece.points), 0)).toBeCloseTo(10000, 6);
    for (const piece of pieces) {
      expect(piece.points.length).toBeGreaterThanOrEqual(3);
      expect(polygonArea(piece.points)).toBeGreaterThan(0);
      for (const point of piece.points) {
        expect(point.x).toBeGreaterThanOrEqual(-1e-8);
        expect(point.y).toBeGreaterThanOrEqual(-1e-8);
        expect(point.x).toBeLessThanOrEqual(100 + 1e-8);
        expect(point.y).toBeLessThanOrEqual(100 + 1e-8);
      }
    }
  });

  it("earns exactly one fragment per completion below the cap", () => {
    for (const target of [1, 6, 12, 24]) {
      const pieces = buildRewardPieces(target);
      for (let completed = 0; completed <= target; completed++) {
        expect(pieces.filter(piece => piece.earnedAt <= completed)).toHaveLength(completed);
      }
    }
  });

  it.each([25, 26, 60, 120, 365])("distributes a target of %i without awarding the final piece early", target => {
    const pieces = buildRewardPieces(target);
    const groups = pieces.map((piece, index) => piece.earnedAt - (pieces[index - 1]?.earnedAt ?? 0));
    expect(new Set(pieces.map(piece => piece.earnedAt)).size).toBe(MAX_REWARD_PIECES);
    expect(Math.max(...groups) - Math.min(...groups)).toBeLessThanOrEqual(1);
    expect(groups.reduce((sum, group) => sum + group, 0)).toBe(target);
    expect(pieces.filter(piece => piece.earnedAt <= target - 1)).toHaveLength(MAX_REWARD_PIECES - 1);
    expect(pieces.at(-1)?.earnedAt).toBe(target);
  });
});
