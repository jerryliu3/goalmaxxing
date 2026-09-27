import type { ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import { QuestCollectionConcept } from "@/features/ux-day-work/quest-collection-concept";
import { StickerAlbumConcept } from "@/features/ux-day-work/sticker-album-concept";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("day work collection concepts", () => {
  it("keeps sticker metadata visible and unfolds the readable brief in place", () => {
    render(<StickerAlbumConcept />);

    expect(screen.getByRole("heading", { name: "A day worth keeping." })).toBeInTheDocument();
    expect(screen.getByText("3 days a week", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Until Dec 31")).toBeInTheDocument();
    expect(screen.getByText("1 of 3 this week")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fold away" }));
    expect(screen.queryByText(/tempo run is 3 days a week/i)).not.toBeInTheDocument();

    const tempoSticker = screen
      .getByRole("heading", { name: "Tempo run" })
      .closest("article");
    expect(tempoSticker).not.toBeNull();
    fireEvent.click(within(tempoSticker!).getByRole("button", { name: "Unfold" }));

    expect(within(tempoSticker!).getAllByRole("button", { name: "Tempo run" })).toHaveLength(2);
    expect(within(tempoSticker!).getByRole("button", { name: "3 days a week" })).toBeInTheDocument();
    expect(within(tempoSticker!).getByRole("button", { name: "Fold away" })).toBeInTheDocument();
  });

  it("shows quest facts before opening and retains the card after completion", () => {
    render(<QuestCollectionConcept />);

    expect(screen.getByRole("heading", { name: "Choose what moves today." })).toBeInTheDocument();
    expect(screen.getAllByText("Rhythm").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Horizon").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Effort").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1 of 3 this week").length).toBeGreaterThan(0);

    vi.useFakeTimers();
    const complete = screen.getByRole("button", { name: "Mark Tempo run complete" });
    fireEvent.pointerDown(complete);
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });

    expect(screen.getByRole("heading", { name: "Tempo run" })).toBeInTheDocument();
    expect(screen.getByText("2 of 3 this week")).toBeInTheDocument();
  });
});
