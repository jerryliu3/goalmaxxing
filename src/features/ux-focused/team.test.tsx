import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamStudy } from "./team";

describe("focused Team journeys", () => {
  it("takes an unpaired user through invitation, cancellation and sample acceptance", () => {
    render(<TeamStudy variant={0} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Sample state" }), {
      target: { value: "No partner" },
    });
    const invite = screen.getByRole("button", { name: "Invite partner" });
    expect(invite).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Partner's username"), {
      target: { value: "alexlee" },
    });
    fireEvent.click(invite);
    expect(screen.getByText("Waiting for @alexlee")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
    expect(
      screen.getByRole("button", { name: "Invite partner" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Invite partner" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Sample: accept invitation" }),
    );
    expect(
      screen.getByRole("heading", { name: "Maya & Alex" }),
    ).toBeInTheDocument();
  });
  it("opens the chosen goal rather than a generic calendar destination", () => {
    render(<TeamStudy variant={0} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Finish the short film Six editing/ }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Finish the short film" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Build the rough cut")).toBeInTheDocument();
    expect(within(dialog).queryByText("Long run")).not.toBeInTheDocument();
  });
  it("focuses the week on the chosen goal in Goal desk", () => {
    render(<TeamStudy variant={1} />);
    const film = screen.getByRole("button", {
      name: /Finish the short film Six editing/,
    });
    fireEvent.click(film);
    expect(film).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Build the rough cut")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Easy run/ }),
    ).not.toBeInTheDocument();
  });
});
