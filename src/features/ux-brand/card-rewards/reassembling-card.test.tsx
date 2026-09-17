import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReassemblingCard } from "./reassembling-card";
import { getRewardFields, REWARD_SAMPLES } from "./reward-model";

afterEach(cleanup);
const fields = getRewardFields(REWARD_SAMPLES[0], 6);

describe("reassembling reward card", () => {
  it("starts as a ghost and inserts only newly earned pieces", () => {
    const { container, rerender } = render(<ReassemblingCard fields={fields} completed={0} target={6} still={false} />);
    expect(container.querySelector("[data-ghost]")).not.toBeNull();
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(0);
    expect(screen.getAllByRole("article", { name: "Goal card preview" })).toHaveLength(1);
    rerender(<ReassemblingCard fields={fields} completed={1} target={6} still={false} />);
    const first = container.querySelector('[data-reward-piece="0"]');
    expect(first).not.toBeNull();
    rerender(<ReassemblingCard fields={fields} completed={2} target={6} still={false} />);
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(2);
    // Existing DOM nodes stay mounted, so their entrance animation cannot replay.
    expect(container.querySelector('[data-reward-piece="0"]')).toBe(first);
  });

  it("waits for the last landing, then removes every fragment and outline", () => {
    const { container, rerender } = render(<ReassemblingCard fields={fields} completed={5} target={6} still={false} />);
    rerender(<ReassemblingCard fields={fields} completed={6} target={6} still={false} />);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "false");
    fireEvent.animationEnd(container.querySelector('[data-reward-piece="4"]')!);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "false");
    fireEvent.animationEnd(container.querySelector('[data-reward-piece="5"]')!);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true");
    expect(container.querySelectorAll("[data-reward-piece], [data-ghost], polygon")).toHaveLength(0);
    expect(screen.getByRole("article", { name: "Build something worth sharing. goal card" })).toBeInTheDocument();
    rerender(<ReassemblingCard fields={fields} completed={5} target={6} still={false} />);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "false");
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(5);
    rerender(<ReassemblingCard fields={fields} completed={6} target={6} still={false} />);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "false");
    fireEvent.animationEnd(container.querySelector('[data-reward-piece="5"]')!);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true");
  });

  it("uses grouped completion thresholds without replaying pieces between thresholds", () => {
    const { container, rerender } = render(<ReassemblingCard fields={fields} completed={4} target={120} still={false} />);
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(0);
    rerender(<ReassemblingCard fields={fields} completed={5} target={120} still={false} />);
    const first = container.querySelector('[data-reward-piece="0"]');
    expect(first).toHaveAttribute("data-earned-at", "5");
    rerender(<ReassemblingCard fields={fields} completed={9} target={120} still={false} />);
    expect(container.querySelectorAll("[data-reward-piece]")).toHaveLength(1);
    expect(container.querySelector('[data-reward-piece="0"]')).toBe(first);
  });

  it("fuses immediately in still mode and stays fused when motion is restored", () => {
    const { container, rerender } = render(<ReassemblingCard fields={fields} completed={5} target={6} still={false} />);
    rerender(<ReassemblingCard fields={fields} completed={6} target={6} still={false} />);
    rerender(<ReassemblingCard fields={fields} completed={6} target={6} still />);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true");
    rerender(<ReassemblingCard fields={fields} completed={6} target={6} still={false} />);
    expect(container.querySelectorAll("[data-reward-piece], [data-ghost]")).toHaveLength(0);
  });

  it("shows an already-earned card seamlessly on mount, including a one-unit goal", () => {
    const { container } = render(<ReassemblingCard fields={fields} completed={1} target={1} still={false} />);
    expect(container.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true");
    expect(container.querySelectorAll("[data-reward-piece], [data-ghost]")).toHaveLength(0);
  });
});
