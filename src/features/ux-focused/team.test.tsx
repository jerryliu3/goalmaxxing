import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamRound } from "./round/team";
describe("dedicated Team journeys", () => {
  it("takes an unpaired user through invite, cancellation and sample acceptance", () => {
    render(<TeamRound variant={0} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Sample state" }), {
      target: { value: "No partner" },
    });
    fireEvent.change(screen.getByLabelText("Partner’s username"), {
      target: { value: "alexlee" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Invite partner" }));
    expect(
      screen.getByText("Invitation pending · @alexlee"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
    fireEvent.click(screen.getByRole("button", { name: "Invite partner" }));
    fireEvent.click(screen.getByRole("button", { name: "Alex accepts" }));
    expect(
      screen.getByRole("heading", { name: "You & Alex" }),
    ).toBeInTheDocument();
  });
  it("opens the chosen team goal and only allows recording your current work", () => {
    render(<TeamRound variant={0} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Finish the short film Six editing/ }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", {
        name: "Finish the short film",
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText("Long run")).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", {
        name: "Complete Review the rough cut",
      }),
    ).toBeDisabled();
    fireEvent.keyDown(
      within(dialog).getByRole("button", {
        name: "Complete Build the rough cut",
      }),
      { key: "Enter" },
    );
    expect(
      within(dialog).queryByRole("button", {
        name: "Complete Build the rough cut",
      }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("Build the rough cut")).toBeInTheDocument();
  });
  it("publishes a support request and distinguishes a read acknowledgement from scheduling", () => {
    render(<TeamRound variant={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Share my check-in" }));
    expect(screen.getByText("Waiting for Alex to read")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Alex reads my check-in" }),
    );
    expect(screen.getByText("Alex has read your check-in")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit my check-in" }));
    fireEvent.change(screen.getByLabelText("My focus this week"), {
      target: { value: "Review the final sound mix" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Share my check-in" }));
    expect(screen.getByText("Waiting for Alex to read")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Acknowledges the note. Does not book a session or promise attendance.",
      ),
    ).toBeInTheDocument();
  });
});
