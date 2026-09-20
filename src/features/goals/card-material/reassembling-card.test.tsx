import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReassemblingCard } from "./reassembling-card";
import { buildRewardPieces, pieceScatter } from "./reward-pieces";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const card = (completed: number, still = false) => <ReassemblingCard completed={completed} target={3} still={still}><article className="tempo-card">A real goal</article></ReassemblingCard>;

describe("saved card assembly", () => {
  it("does not replay historical pieces on open; animates only new credit", () => {
    const { container, rerender } = render(card(1));
    const first = container.querySelector('[data-reward-piece="0"]');
    expect(first).toHaveAttribute("data-arriving", "false");
    rerender(card(2));
    expect(container.querySelector('[data-reward-piece="0"]')).toBe(first);
    expect(container.querySelector('[data-reward-piece="1"]')).toHaveAttribute("data-arriving", "true");
  });
  it("fuses only after final landing and supports undo then re-earning", () => {
    const { container, rerender } = render(card(2));
    rerender(card(3));
    expect(container.querySelector('[data-reassembly]')).toHaveAttribute("data-fused", "false");
    fireEvent.animationEnd(container.querySelector('[data-reward-piece="2"]')!);
    expect(container.querySelectorAll('[data-ghost], [data-reward-piece]')).toHaveLength(0);
    rerender(card(2));
    expect(container.querySelectorAll('[data-reward-piece]')).toHaveLength(2);
    rerender(card(3));
    expect(container.querySelector('[data-reward-piece="2"]')).toHaveAttribute("data-arriving", "true");
  });
  it("extrudes each landed fragment; the ghost outline stays flat", () => {
    const { container } = render(card(2));
    expect(container.querySelector('[data-ghost] [data-card-solid]')).toBeNull();
    const pieces = container.querySelectorAll('[data-reward-piece]');
    expect(pieces).toHaveLength(2);
    for (const piece of pieces) {
      expect(piece.querySelector('[data-card-solid]')).not.toBeNull();
    }
  });
  it("preview shards the whole card apart onto the ghost map", () => {
    vi.useFakeTimers();
    const { container } = render(
      <ReassemblingCard completed={0} target={4} still={false} preview>
        <article className="tempo-card">A real goal</article>
      </ReassemblingCard>,
    );
    const surface = container.querySelector("[data-reassembly]")!;
    expect(surface).toHaveAttribute("data-preview-phase", "whole");
    expect(container.querySelector("[data-preview-whole]")).not.toBeNull();
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(0);
    act(() => { vi.advanceTimersByTime(320); });
    expect(surface).toHaveAttribute("data-preview-phase", "etched");
    expect(container.querySelector("[data-preview-whole]")).toBeNull();
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(4);
    act(() => { vi.advanceTimersByTime(480); });
    expect(surface).toHaveAttribute("data-preview-phase", "released");
    act(() => { vi.advanceTimersByTime(850); });
    expect(surface).toHaveAttribute("data-preview-phase", "ghost");
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(0);
    expect(container.querySelector("[data-ghost]")).not.toBeNull();
    expect(container.querySelectorAll(".tempo-card")).toHaveLength(2);
    vi.useRealTimers();
  });

  it("uses each polygon's prototype scatter vector during preview shattering", () => {
    vi.useFakeTimers();
    const { container } = render(
      <ReassemblingCard completed={0} target={4} still={false} preview>
        <article className="tempo-card">A real goal</article>
      </ReassemblingCard>,
    );

    act(() => { vi.advanceTimersByTime(320); });

    const pieces = buildRewardPieces(4);
    const rendered = [...container.querySelectorAll<HTMLElement>("[data-reward-piece]")];
    expect(rendered).toHaveLength(pieces.length);
    for (const [index, element] of rendered.entries()) {
      const scatter = pieceScatter(pieces[index]!);
      expect(element.style.getPropertyValue("--scatter-x")).toBe(`${scatter.x}px`);
      expect(element.style.getPropertyValue("--scatter-y")).toBe(`${scatter.y}px`);
    }
    const verticalVectors = pieces.map(piece => pieceScatter(piece).y);
    expect(verticalVectors.some(y => y > 0)).toBe(true);
    expect(verticalVectors.some(y => y < 0)).toBe(true);

    vi.useRealTimers();
  });

  it("skips preview sharding when motion is reduced", () => {
    const { container } = render(
      <ReassemblingCard completed={0} target={4} still preview>
        <article className="tempo-card">A real goal</article>
      </ReassemblingCard>,
    );
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-preview-phase", "ghost");
    expect(container.querySelector("[data-preview-whole]")).toBeNull();
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(0);
  });

  it("opens earned cards seamlessly and completes without animation in still mode", () => {
    const { container, rerender } = render(card(3));
    expect(container.querySelector('[data-reassembly]')).toHaveAttribute("data-fused", "true");
    rerender(card(2, true));
    rerender(card(3, true));
    expect(container.querySelectorAll('[data-ghost], [data-reward-piece]')).toHaveLength(0);
    rerender(card(3, false));
    expect(container.querySelector('[data-reassembly]')).toHaveAttribute("data-fused", "true");
  });

  it("paints gallery shards as one clipped 2D face", () => {
    const { container } = render(
      <ReassemblingCard completed={2} target={3} still flat>
        <article className="tempo-card">A real goal</article>
      </ReassemblingCard>,
    );
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-flat", "true");
    expect(container.querySelector("[data-ghost]")).not.toBeNull();
    expect(container.querySelector("[data-flat-shards]")).toHaveAttribute("data-piece-count", "2");
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(0);
    expect(container.querySelector("[data-card-solid]")).toBeNull();
    expect(container.querySelectorAll("clipPath polygon")).toHaveLength(2);
    expect(container.querySelectorAll(".tempo-card")).toHaveLength(2);
  });
});
