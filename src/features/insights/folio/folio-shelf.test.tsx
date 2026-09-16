import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { buildGoalFolios } from "./folio-model";
import { FolioShelf } from "./folio-shelf";
import { summary } from "./folio-test-fixtures";

const motionPreference = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", async importOriginal => ({
  ...await importOriginal<typeof import("motion/react")>(),
  useReducedMotion: () => motionPreference.reduced,
}));

afterEach(() => { cleanup(); motionPreference.reduced = false; vi.restoreAllMocks(); });

function finishOpening(reader: HTMLElement) {
  const flight = reader.querySelector("[data-folio-flight]");
  expect(flight).not.toBeNull();
  // React selects the WebKit event in jsdom, which lacks AnimationEvent.
  fireEvent(flight!, new Event("webkitAnimationEnd", { bubbles: true }));
}


describe("folio reader", () => {
  it("opens the shared Tempo card, navigates goals, bounds arrows, and restores focus", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "first", title: "Learn piano", end_date: "2026-07-01" }), buildGoal({ id: "second", title: "Run a 10k", end_date: "2026-08-01" })];
    const folios = buildGoalFolios(goals, goals.map(goal => summary(goal.id)), "user-1");
    render(<FolioShelf folios={folios} />);
    const book = screen.getByRole("button", { name: "Open 2026, 2 goals" });
    await user.click(book);
    const reader = screen.getByRole("dialog");
    finishOpening(reader);
    expect(within(reader).getByRole("article", { name: "Learn piano goal card" })).toHaveClass("tempo-card");
    expect(within(reader).getByRole("button", { name: "Previous goal" })).toBeDisabled();
    await user.click(within(reader).getByRole("button", { name: "Next goal" }));
    expect(within(reader).getByRole("article", { name: "Run a 10k goal card" })).toBeInTheDocument();
    expect(within(reader).getByRole("button", { name: "Next goal" })).toBeDisabled();
    // Focus an enabled control, then use the reader's keyboard navigation.
    within(reader).getByRole("button", { name: "Previous goal" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(within(reader).getByRole("button", { name: "Previous goal" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(book).toHaveFocus();
  });

  it("labels the shared card by how each goal ended", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "won", title: "Learn piano", end_date: "2026-07-01" }), buildGoal({ id: "stopped", title: "Run a 10k", end_date: "2026-08-01" })];
    const folios = buildGoalFolios(goals, [summary("won", { outcome: "achieved", achievementDate: "2026-07-01" }), summary("stopped")], "user-1");
    render(<FolioShelf folios={folios} />);
    await user.click(screen.getByRole("button", { name: "Open 2026, 2 goals" }));
    const reader = screen.getByRole("dialog");
    finishOpening(reader);
    expect(within(reader).getByText("A goal you accomplished")).toBeInTheDocument();
    await user.click(within(reader).getByRole("button", { name: "Next goal" }));
    expect(within(reader).getByText("A goal you showed up for")).toBeInTheDocument();
  });

  it("travels from the selected book, gates controls, and allows dismissal during flight", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "one", end_date: "2026-07-01" }), buildGoal({ id: "two", end_date: "2025-07-01" })];
    const folios = buildGoalFolios(goals, goals.map(goal => summary(goal.id)), "user-1");
    render(<FolioShelf folios={folios} />);
    const book = screen.getByRole("button", { name: "Open 2025, 1 goal" });
    const cover = book.querySelector<HTMLElement>("[data-folio-book]")!;
    vi.spyOn(cover, "getBoundingClientRect").mockReturnValue({ left: 100, top: 200, width: 240, height: 320 } as DOMRect);
    Object.defineProperty(cover, "offsetWidth", { value: 240 });
    Object.defineProperty(cover, "offsetHeight", { value: 320 });
    await user.click(book);
    const dialog = screen.getByRole("dialog");
    const flight = dialog.querySelector<HTMLElement>("[data-folio-flight]")!;
    expect(flight.style.getPropertyValue("--flight-x")).toBe(`${220 - window.innerWidth / 2}px`);
    expect(flight.style.getPropertyValue("--flight-y")).toBe(`${360 - window.innerHeight / 2}px`);
    expect(dialog.style.getPropertyValue("--folio-cloth")).toBe(book.style.getPropertyValue("--folio-cloth"));
    expect(dialog.querySelector("[inert]")).not.toBeNull();
    expect(dialog).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(book).toHaveFocus();
    expect(book).toHaveAttribute("data-open", "false");
    await user.click(book);
    const reopened = screen.getByRole("dialog");
    finishOpening(reopened);
    expect(reopened.querySelector("[inert]")).toBeNull();
    expect(reopened.querySelector("[data-folio-flight]")).toBeNull();
  });

  it("focuses the reader after arrival and opens directly with reduced motion", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "one", end_date: "2026-07-01" }), buildGoal({ id: "two", end_date: "2026-08-01" })];
    const folios = buildGoalFolios(goals, goals.map(goal => summary(goal.id)), "user-1");
    const { rerender } = render(<FolioShelf folios={folios} />);
    const book = screen.getByRole("button", { name: "Open 2026, 2 goals" });
    await user.click(book);
    finishOpening(screen.getByRole("dialog"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Next goal" })).toHaveFocus());
    await user.keyboard("{Escape}");
    motionPreference.reduced = true;
    rerender(<FolioShelf folios={folios} />);
    await user.click(book);
    const reader = screen.getByRole("dialog");
    expect(reader.querySelector("[data-folio-flight]")).toBeNull();
    expect(reader.querySelector("[inert]")).toBeNull();
    expect(within(reader).getByRole("button", { name: "Next goal" })).toHaveFocus();
  });

});
