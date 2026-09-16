import { describe, expect, it } from "vitest";
import { cardOptics, pointerPose, REST_POSE, TILTED_POSE } from "./card-optics";

describe("card optics", () => {
  it("tilts both axes with bounded pointer input", () => {
    expect(pointerPose(0.5, 0.5)).toEqual({ x: 0, y: 0 });
    expect(pointerPose(-2, 3)).toEqual(pointerPose(0, 1));
    expect(pointerPose(0, 0).x).toBeGreaterThan(0);
    expect(pointerPose(0, 0).y).toBeLessThan(0);
    expect(pointerPose(1, 1).x).toBeLessThan(0);
    expect(pointerPose(1, 1).y).toBeGreaterThan(0);
  });

  it("moves the reflection and side lighting with orientation, not pointer position alone", () => {
    const left = cardOptics({ x: 0, y: -22 });
    const right = cardOptics({ x: 0, y: 22 });
    expect(parseFloat(left["--shine-position"])).toBeGreaterThan(parseFloat(right["--shine-position"]));
    expect(parseFloat(left["--rim-light-x"])).toBeGreaterThan(parseFloat(right["--rim-light-x"]));
    const above = cardOptics({ x: -18, y: 0 });
    const below = cardOptics({ x: 18, y: 0 });
    expect(above["--shine-position"]).not.toBe(below["--shine-position"]);
    expect(above["--rim-light-y"]).not.toBe(below["--rim-light-y"]);
  });

  it("gives keyboard poses the same deterministic reflection as pointer poses", () => {
    expect(cardOptics(TILTED_POSE)).toEqual(cardOptics({ ...TILTED_POSE }));
    expect(cardOptics(TILTED_POSE)["--shine-position"]).not.toBe(cardOptics(REST_POSE)["--shine-position"]);
    expect(cardOptics(TILTED_POSE)["--metal-x"]).not.toBe(cardOptics(REST_POSE)["--metal-x"]);
  });
});
