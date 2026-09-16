import { describe, expect, it } from "vitest";
import { cardOptics, dragPose, nearestPose, pointerPose, REST_POSE, TILTED_POSE } from "./card-optics";

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
    expect(above["--shine-strength"]).not.toBe(below["--shine-strength"]);
    expect(above["--rim-light-y"]).not.toBe(below["--rim-light-y"]);
    expect(above["--relief-shadow-y"]).not.toBe(below["--relief-shadow-y"]);
    expect(parseFloat(above["--relief-light-y"])).toBeLessThan(0);
    expect(parseFloat(above["--relief-shadow-y"])).toBeGreaterThan(0);
  });

  it("gives keyboard poses the same deterministic reflection as pointer poses", () => {
    expect(cardOptics(TILTED_POSE)).toEqual(cardOptics({ ...TILTED_POSE }));
    expect(cardOptics(TILTED_POSE)["--shine-position"]).not.toBe(cardOptics(REST_POSE)["--shine-position"]);
    expect(cardOptics(TILTED_POSE)["--metal-x"]).not.toBe(cardOptics(REST_POSE)["--metal-x"]);
  });

  it("sweeps the beam across the face while keeping its angle nearly fixed", () => {
    const left = cardOptics({ x: 0, y: -22 });
    const right = cardOptics({ x: 0, y: 22 });
    expect(Math.abs(parseFloat(left["--shine-position"]) - parseFloat(right["--shine-position"]))).toBeGreaterThan(90);
    expect(Math.abs(parseFloat(left["--shine-angle"]) - parseFloat(right["--shine-angle"]))).toBeLessThan(4);
    expect(left["--pearl-x"]).not.toBe(right["--pearl-x"]);
    expect(cardOptics({ x: 20, y: 0 })["--pearl-y"]).not.toBe(cardOptics({ x: -20, y: 0 })["--pearl-y"]);
  });

  it("allows full revolutions and resets without unwinding them", () => {
    const turned = dragPose({ x: 0, y: 0 }, 500, -300);
    expect(turned).toEqual({ x: 240, y: 400 });
    const reset = nearestPose(turned, REST_POSE);
    expect(Math.abs(reset.x - turned.x)).toBeLessThanOrEqual(180);
    expect(Math.abs(reset.y - turned.y)).toBeLessThanOrEqual(180);
    expect((reset.y - REST_POSE.y) % 360).toBe(0);
    const hoverAfterReset = nearestPose(reset, pointerPose(0.5, 0.5));
    expect(Math.abs(hoverAfterReset.y - reset.y)).toBeLessThan(30);
    expect(Math.abs(hoverAfterReset.x - reset.x)).toBeLessThan(30);
  });

});
