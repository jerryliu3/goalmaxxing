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

function finishFlight(reader: HTMLElement) {
  const flight = reader.querySelector("[data-folio-flight]");
  expect(flight).not.toBeNull();
  // React selects the WebKit event in jsdom, which lacks AnimationEvent.
  fireEvent(flight!, new Event("webkitAnimationEnd", { bubbles: true }));
}

async function dismissReader(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard("{Escape}");
  finishFlight(screen.getByRole("dialog"));
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
    finishFlight(reader);
    expect(within(reader).getByRole("article", { name: "Learn piano goal card" })).toHaveClass("tempo-card");
    expect(within(reader).getByRole("group", { name: "Learn piano rotation" })).toBeInTheDocument();
    expect(reader.querySelector(".tempo-card-surface")).toHaveAttribute("data-rotatable", "true");
    expect(within(reader).getByRole("button", { name: "Previous goal" })).toBeDisabled();
    await user.click(within(reader).getByRole("button", { name: "Next goal" }));
    expect(within(reader).getByRole("article", { name: "Run a 10k goal card" })).toBeInTheDocument();
    expect(within(reader).getByRole("button", { name: "Next goal" })).toBeDisabled();
    // Focus an enabled control, then use the reader's keyboard navigation.
    within(reader).getByRole("button", { name: "Previous goal" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(within(reader).getByRole("button", { name: "Previous goal" })).toBeDisabled();
    await dismissReader(user);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(book).toHaveFocus());
  });

  it("labels the shared card by how each goal ended", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "won", title: "Learn piano", end_date: "2026-07-01" }), buildGoal({ id: "stopped", title: "Run a 10k", end_date: "2026-08-01" })];
    const folios = buildGoalFolios(goals, [summary("won", { outcome: "achieved", achievementDate: "2026-07-01" }), summary("stopped")], "user-1");
    render(<FolioShelf folios={folios} />);
    await user.click(screen.getByRole("button", { name: "Open 2026, 2 goals" }));
    const reader = screen.getByRole("dialog");
    finishFlight(reader);
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
    const flightBooks = dialog.querySelectorAll<HTMLElement>("[data-folio-flight-layer] [data-folio-book]");
    expect(flightBooks.length).toBeGreaterThan(0);
    flightBooks.forEach(flightBook => expect(flightBook.style.getPropertyValue("--folio-cloth")).toBe(cover.style.getPropertyValue("--folio-cloth")));
    expect(Number(dialog.style.getPropertyValue("--reveal-sx"))).toBeGreaterThan(0);
    expect(Number(dialog.style.getPropertyValue("--reveal-sy"))).toBeGreaterThan(0);
    const pages = dialog.querySelector("[data-folio-flight-layer='pages']");
    const coverLayer = dialog.querySelector("[data-folio-flight-layer='cover']");
    const surface = dialog.querySelector("[data-folio-reader]");
    expect(pages).not.toBeNull();
    expect(coverLayer).not.toBeNull();
    expect(surface).not.toBeNull();
    expect(pages!.compareDocumentPosition(surface!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(surface!.compareDocumentPosition(coverLayer!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dialog.querySelector("[inert]")).not.toBeNull();
    expect(dialog).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(book).toHaveFocus());
    expect(book).toHaveAttribute("data-open", "false");
    await user.click(book);
    const reopened = screen.getByRole("dialog");
    finishFlight(reopened);
    expect(reopened.querySelector("[inert]")).toBeNull();
    expect(reopened.querySelector("[data-folio-flight]")).toBeNull();
  });

  it("folds the reader back into the book and returns it to the shelf", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "one", end_date: "2026-07-01" })];
    const folios = buildGoalFolios(goals, [summary("one")], "user-1");
    render(<FolioShelf folios={folios} />);
    const book = screen.getByRole("button", { name: "Open 2026, 1 goal" });
    await user.click(book);
    finishFlight(screen.getByRole("dialog"));
    await user.keyboard("{Escape}");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-leaving", "true");
    expect(dialog.querySelector("[data-folio-flight]")).not.toBeNull();
    expect(dialog.querySelector("[inert]")).not.toBeNull();
    expect(book).toHaveAttribute("data-open", "true");
    finishFlight(dialog);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(book).toHaveFocus());
    expect(book).toHaveAttribute("data-open", "false");
  });

  it("focuses the reader after arrival and opens directly with reduced motion", async () => {
    const user = userEvent.setup();
    const goals = [buildGoal({ id: "one", end_date: "2026-07-01" }), buildGoal({ id: "two", end_date: "2026-08-01" })];
    const folios = buildGoalFolios(goals, goals.map(goal => summary(goal.id)), "user-1");
    const { rerender } = render(<FolioShelf folios={folios} />);
    const book = screen.getByRole("button", { name: "Open 2026, 2 goals" });
    await user.click(book);
    finishFlight(screen.getByRole("dialog"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Next goal" })).toHaveFocus());
    await dismissReader(user);
    motionPreference.reduced = true;
    rerender(<FolioShelf folios={folios} />);
    await user.click(book);
    const reader = screen.getByRole("dialog");
    expect(reader.querySelector("[data-folio-flight]")).toBeNull();
    expect(reader.querySelector("[inert]")).toBeNull();
    expect(within(reader).getByRole("button", { name: "Next goal" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

});
