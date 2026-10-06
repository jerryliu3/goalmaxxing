import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LedgerConcept } from "@/features/ux-recovery/ledger-concept";
import { RecoveryIndex } from "@/features/ux-recovery/recovery-index";

afterEach(cleanup);

describe("recovery study", () => {
  it("lists the three review concepts and the Agenda entry", () => {
    render(<RecoveryIndex />);
    for (const [name, slug] of [
      ["Ledger", "ledger"],
      ["On the calendar", "calendar"],
      ["One at a time", "deck"],
    ]) {
      expect(screen.getByRole("link", { name: `Open ${name}` })).toHaveAttribute("href", `/ux/recovery/${slug}`);
    }
    expect(screen.getAllByText("5 sessions slipped").length).toBeGreaterThan(0);
  });

  it("opens the ledger from the Agenda line, accepts all, and applies", () => {
    render(<LedgerConcept />);
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByRole("dialog", { name: "Review slipped sessions" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept all (4)" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply (4)" }));
    expect(screen.getByRole("heading", { name: "Your plan is back on track." })).toBeInTheDocument();
  });
});
