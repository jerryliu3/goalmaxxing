import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AchievementsIndex } from "@/features/ux-achievements/achievements-index";
import { CaseConcept } from "@/features/ux-achievements/case-concept";
import { GalleryConcept } from "@/features/ux-achievements/gallery-concept";
import { RecordsConcept } from "@/features/ux-achievements/records-concept";
import { RingsConcept } from "@/features/ux-achievements/rings-concept";
import { ShowcaseConcept } from "@/features/ux-achievements/showcase-concept";
import { VaultConcept } from "@/features/ux-achievements/vault-concept";

afterEach(cleanup);

describe("achievements destination study", () => {
  it("lists Showcase first, then the five reference concepts", () => {
    render(<AchievementsIndex />);
    for (const name of ["Showcase", "Case", "Vault", "Gallery", "Records", "Rings"]) {
      expect(screen.getByRole("link", { name: `Open ${name}` })).toHaveAttribute(
        "href",
        `/ux/achievements/${name.toLowerCase()}`
      );
    }
  });

  it("composes Showcase as Case shelves, Vault metal, and Records bests", async () => {
    const user = userEvent.setup();
    render(<ShowcaseConcept />);

    expect(screen.getByLabelText("Personal records")).toBeInTheDocument();
    expect(screen.getByText("21d")).toBeInTheDocument();
    expect(screen.getByText("Claimed")).toBeInTheDocument();
    expect(screen.getByText(/\d+\/\d+ · \d+%/)).toBeInTheDocument();
    expect(screen.getByLabelText("Trophy showcase")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Level 8 unlocked" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /lv 4/i }));
    expect(screen.getAllByRole("heading", { name: "Level 4 unlocked" }).length).toBeGreaterThan(0);
    // Mirrors production: finished goals no longer get a plaque rail.
    expect(screen.queryByText(/plaque rail/i)).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /^locked award$/i })[0]!);
    expect(screen.getByRole("heading", { name: "Still ahead" })).toBeInTheDocument();
    expect(screen.queryByText(/level 10 unlocked/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^locked$/i).length).toBeGreaterThan(0);
  });

  it("pins a shelf medal onto the Case pedestal", async () => {
    const user = userEvent.setup();
    render(<CaseConcept />);

    expect(screen.getByRole("heading", { name: "Level 8 unlocked" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /lv 4/i }));
    expect(screen.getAllByRole("heading", { name: "Level 4 unlocked" }).length).toBeGreaterThan(0);
    expect(screen.getByText(/plaque rail/i)).toBeInTheDocument();
  });

  it("opens a sealed vault cell into the inspection drawer", async () => {
    const user = userEvent.setup();
    render(<VaultConcept />);

    expect(screen.getByText(/sealed until earned/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /lv 10/i }));
    expect(screen.getByText(/still sealed/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Level 10 unlocked" })).toBeInTheDocument();
  });

  it("stages Gallery medals as snap posters with a certificate rail", () => {
    render(<GalleryConcept />);

    expect(screen.getByText(/hang what you earned/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Medal gallery")).toBeInTheDocument();
    expect(screen.getByLabelText("Goal certificates")).toBeInTheDocument();
    expect(screen.getByText(/thesis defense/i)).toBeInTheDocument();
  });

  it("shows Records as personal bests above awards", async () => {
    const user = userEvent.setup();
    render(<RecordsConcept />);

    expect(screen.getByText(/bests first/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Personal records")).toBeInTheDocument();
    expect(screen.getByText("21d")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /lv 6/i }));
    expect(screen.getByText(/six seasons of showing up/i)).toBeInTheDocument();
  });

  it("filters Rings inventory from the completion glance", async () => {
    const user = userEvent.setup();
    render(<RingsConcept />);

    expect(screen.getByRole("heading", { name: /close the rings/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Achievement rings")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^goals/i }));
    expect(screen.getByText(/goal finishes/i)).toBeInTheDocument();
    expect(screen.getByText(/thesis defense/i)).toBeInTheDocument();
  });
});
