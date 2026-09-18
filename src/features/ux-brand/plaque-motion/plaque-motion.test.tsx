import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaqueMotionStudy } from "./plaque-motion-study";
import { ReviewPreview } from "./review-preview";
import { studyFields } from "./study-model";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => preference.reduced }));
vi.mock("./fragment-plaque", () => ({ FragmentPlaque: ({ phase, target }: { phase: string; target: number }) =>
  <div data-testid="plaque" data-phase={phase} data-target={target} /> }));
vi.mock("@/features/insights/folio/folio-book", () => ({ FolioBook: () => <div>2026 goal book</div> }));

beforeEach(() => { vi.useFakeTimers(); preference.reduced = false; });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("review plaque choreography", () => {
  it("shows the whole goal, separates it, then leaves the empty map", () => {
    render(<ReviewPreview fields={studyFields(12, "hard")} target={12} still={false} onTargetChange={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByTestId("plaque")).toHaveAttribute("data-phase", "whole");
    advance(320);
    expect(screen.getByTestId("plaque")).toHaveAttribute("data-phase", "etched");
    advance(480);
    expect(screen.getByTestId("plaque")).toHaveAttribute("data-phase", "released");
    advance(850);
    expect(screen.getByTestId("plaque")).toHaveAttribute("data-phase", "ghost");
  });

  it("lets a count edit interrupt the reveal without a later timer replaying it", () => {
    render(<PlaqueMotionStudy />);
    advance(320);
    fireEvent.change(screen.getByLabelText("Completions to earn this plaque"), { target: { value: "7" } });
    advance(2000);
    expect(screen.getByTestId("plaque")).toHaveAttribute("data-phase", "ghost");
    expect(screen.getByTestId("plaque")).toHaveAttribute("data-target", "7");
    expect(screen.getByRole("status")).toHaveTextContent("7 completions · 7 pieces");
    fireEvent.change(screen.getByLabelText("Completions to earn this plaque"), { target: { value: "1" } });
    expect(screen.getByRole("button", { name: "One fewer completion" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("1 completion · 1 piece");
    fireEvent.change(screen.getByLabelText("Completions to earn this plaque"), { target: { value: "99" } });
    expect(screen.getByLabelText("Completions to earn this plaque")).toHaveValue(20);
  });
});

describe("earned plaque ceremony", () => {
  function start() {
    render(<PlaqueMotionStudy />);
    fireEvent.click(screen.getByRole("button", { name: "02 / The keepsake" }));
    fireEvent.click(screen.getByRole("button", { name: "Complete the final one" }));
  }

  it("fuses before congratulations, waits for the user, and then keeps the book", () => {
    start();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "lift");
    advance(720);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "gather");
    advance(1050);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "seal");
    advance(420);
    expect(screen.getByText("Your reward · A weekend away")).toBeVisible();
    advance(15000);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "celebrate");
    fireEvent.click(screen.getByRole("button", { name: "Keep in my book" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "shelve");
    advance(1500);
    expect(screen.getByText("Saved in your 2026 goal book.")).toBeVisible();
  });

  it("offers immediate skip and cancels the running beat", () => {
    start();
    fireEvent.click(screen.getByRole("button", { name: "Skip animation" }));
    advance(5000);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "celebrate");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    advance(1000);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("honors OS reduced motion and omits reward copy when none is set", () => {
    preference.reduced = true;
    render(<PlaqueMotionStudy />);
    expect(screen.getByTestId("plaque")).toHaveAttribute("data-phase", "ghost");
    expect(screen.getByRole("checkbox", { name: "Reduced motion" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Personal reward"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "02 / The keepsake" }));
    fireEvent.click(screen.getByRole("button", { name: "Complete the final one" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "celebrate");
    expect(screen.queryByText(/Your reward ·/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Keep in my book" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "kept");
  });
});
