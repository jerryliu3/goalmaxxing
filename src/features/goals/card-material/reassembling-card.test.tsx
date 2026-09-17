import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReassemblingCard } from "./reassembling-card";

afterEach(cleanup);
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
  it("opens earned cards seamlessly and completes without animation in still mode", () => {
    const { container, rerender } = render(card(3));
    expect(container.querySelector('[data-reassembly]')).toHaveAttribute("data-fused", "true");
    rerender(card(2, true));
    rerender(card(3, true));
    expect(container.querySelectorAll('[data-ghost], [data-reward-piece]')).toHaveLength(0);
  });
});
