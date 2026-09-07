import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { FirstPrinciplesIndex } from "@/features/ux-first-principles/first-principles-index";
import { FieldbookConcept } from "@/features/ux-first-principles/fieldbook-concept";
import { OrbitConcept } from "@/features/ux-first-principles/orbit-concept";
import { RelayConcept } from "@/features/ux-first-principles/relay-concept";
import { TideConcept } from "@/features/ux-first-principles/tide-concept";

afterEach(cleanup);

describe("first-principles interface study", () => {
  it("presents four independent interaction systems", () => {
    render(<FirstPrinciplesIndex />);

    expect(
      screen.getByRole("heading", { name: /start with behavior/i })
    ).toBeInTheDocument();
    for (const name of ["Orbit", "Tide", "Relay", "Fieldbook"]) {
      expect(screen.getByRole("link", { name: `Open ${name}` })).toHaveAttribute(
        "href",
        `/ux/first-principles/${name.toLowerCase()}`
      );
    }
  });

  it("uses a selected goal body as Orbit's completion action", async () => {
    const user = userEvent.setup();
    render(<OrbitConcept />);

    await user.click(
      screen.getByRole("button", { name: /mark tempo run complete/i })
    );
    expect(
      screen.getByRole("button", { name: /remove completion for tempo run/i })
    ).toBeInTheDocument();
  });

  it("moves work across Tide's completed shore", async () => {
    const user = userEvent.setup();
    render(<TideConcept />);

    await user.click(
      screen.getByRole("button", { name: /sweep tempo run complete/i })
    );
    expect(
      screen.getByRole("button", { name: /return tempo run to current/i })
    ).toBeInTheDocument();
  });

  it("rescales Tide's current from day to week to month", async () => {
    const user = userEvent.setup();
    render(<TideConcept />);

    expect(
      screen.getByRole("heading", { name: /let the day move/i })
    ).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^week$/i }));
    expect(
      screen.getByRole("heading", { name: /let the week move/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Thu 3")).toBeInTheDocument();
    expect(screen.queryByText("10:00")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^month$/i }));
    expect(
      screen.getByRole("heading", { name: /let the month move/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Sep 15")).toBeInTheDocument();
    expect(screen.queryByText("Thu 3")).not.toBeInTheDocument();
  });

  it("supports keyboard activation on Relay's large completion control", async () => {
    const user = userEvent.setup();
    render(<RelayConcept />);

    const complete = screen.getByRole("button", {
      name: /hold to complete tempo run/i,
    });
    complete.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("button", { name: /hold to complete launch notes/i })
    ).toBeInTheDocument();
  });

  it("leaves a removable completion stamp in Fieldbook", async () => {
    const user = userEvent.setup();
    render(<FieldbookConcept />);

    await user.click(
      screen.getByRole("button", { name: /stamp tempo run complete/i })
    );
    expect(
      screen.getByRole("button", {
        name: /remove completion stamp from tempo run/i,
      })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^people$/i }));
    expect(screen.getByRole("heading", { name: "Maya" })).toBeInTheDocument();
  });
});
