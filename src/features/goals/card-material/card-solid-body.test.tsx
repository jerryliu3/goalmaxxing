import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CardSolidBody } from "./card-solid-body";

afterEach(cleanup);

describe("rounded card walls", () => {
  it("faces every corner facet outward and joins adjacent chord endpoints", () => {
    const { container } = render(<CardSolidBody />);
    const corners = Array.from(container.querySelectorAll<HTMLElement>("[data-card-solid] > span"))
      .filter(element => element.children.length === 8);
    expect(corners).toHaveLength(4);
    for (const corner of corners) {
      let previousEnd: { x: number; y: number } | undefined;
      for (const facet of Array.from(corner.children) as HTMLElement[]) {
        const value = (key: string) => parseFloat(facet.style.getPropertyValue(key));
        const turn = value("--turn") * Math.PI / 180;
        // CSS rotateZ(turn) rotateX(90deg) transforms +Z to
        // (sin(turn), -cos(turn), 0). It must face away from the body.
        const nx = Math.sin(turn);
        const ny = -Math.cos(turn);
        expect(nx * value("--cx") + ny * value("--cy")).toBeGreaterThan(0.99);
        expect(nx).toBeCloseTo(value("--nx"), 5);
        expect(ny).toBeCloseTo(value("--ny"), 5);

        // Unit-radius chord endpoints must meet; the CSS adds a tiny overlap
        // on top of these dimensions to cover rasterization seams.
        const halfChord = Math.sin(Math.PI / 32);
        const start = {
          x: value("--cx") - Math.cos(turn) * halfChord,
          y: value("--cy") - Math.sin(turn) * halfChord,
        };
        const end = {
          x: value("--cx") + Math.cos(turn) * halfChord,
          y: value("--cy") + Math.sin(turn) * halfChord,
        };
        if (previousEnd) {
          expect(start.x).toBeCloseTo(previousEnd.x, 5);
          expect(start.y).toBeCloseTo(previousEnd.y, 5);
        }
        previousEnd = end;
      }
    }
  });
});
