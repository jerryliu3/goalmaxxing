import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardMaterialsStudy } from "./card-materials-study";
import { MATERIALS } from "./materials";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => preference.reduced }));
afterEach(() => { cleanup(); preference.reduced = false; });

describe("card material comparison", () => {
  it("uses geometric embossing and keeps depth independent of printed/engraved comparisons", async () => {
    const user = userEvent.setup();
    render(<CardMaterialsStudy />);
    const page = screen.getByRole("main");
    const foil = screen.getByRole("region", { name: "Foil Print" });
    const card = within(foil).getByRole("article", { name: "Goal card preview" });
    // The filtered material is a sibling, never an ancestor of the raised type.
    expect(card.closest("[data-card-object]")?.querySelector(":scope > [data-material-surface]")).not.toBeNull();
    expect(card.closest("[data-material-surface]")).toBeNull();
    expect(card.querySelector('[data-lettering-solid="display"] [data-lettering-face]')).not.toBeNull();
    expect(page.style.getPropertyValue("--letter-relief-display")).toBe("none");
    expect(page.style.getPropertyValue("--raised-text-depth")).toBe("6px");
    await user.selectOptions(screen.getByRole("combobox", { name: "Text depth" }), "12");
    expect(page.style.getPropertyValue("--raised-text-depth")).toBe("12px");
    await user.selectOptions(screen.getByRole("combobox", { name: "Text depth" }), "4");
    await user.click(screen.getByRole("checkbox", { name: "Still mode" }));
    expect(page.style.getPropertyValue("--raised-text-depth")).toBe("4px");
    const category = card.querySelector(".tempo-card-period");
    expect(category?.querySelector("[data-lettering-solid]")).toBeNull();
    expect(card.querySelector(".tempo-card-target [data-lettering-solid=\"supporting\"]")).not.toBeNull();
    expect(card.querySelector("h2 [data-lettering-solid=\"title\"]")).not.toBeNull();
    await user.selectOptions(screen.getByRole("combobox", { name: "Lettering" }), "flat");
    expect(page).toHaveAttribute("data-lettering", "flat");
    expect(screen.getByRole("combobox", { name: "Text depth" })).toBeDisabled();
    expect(page.style.getPropertyValue("--letter-relief-display")).toBe("none");
    await user.selectOptions(screen.getByRole("combobox", { name: "Lettering" }), "recessed");
    const id = page.style.getPropertyValue("--letter-relief-display").match(/url\("#(.+)"\)/)?.[1];
    expect(document.getElementById(id!)?.querySelector('[result="innerShadow"]')).not.toBeNull();
    await user.click(screen.getByRole("tab", { name: "02 In the app" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Lettering" }), "raised");
    expect(page.style.getPropertyValue("--raised-text-depth")).toBe("4px");
    const team = screen.getByRole("region", { name: "Team membership card" });
    expect(within(team).getByRole("heading", { name: /The Early\s*Hours Club/ })).toBeInTheDocument();
    expect(team.querySelector('[data-lettering-solid="display"]')).not.toBeNull();
  });

  it("keeps shared goal content and history copy consistent across materials", async () => {
    const user = userEvent.setup();
    render(<CardMaterialsStudy />);
    expect(screen.getAllByRole("article", { name: "Goal card preview" })).toHaveLength(MATERIALS.length);
    await user.selectOptions(screen.getByRole("combobox", { name: "Sample goal" }), "1");
    await user.click(screen.getByRole("checkbox", { name: "Completed goal" }));
    for (const material of MATERIALS) {
      const region = screen.getByRole("region", { name: material.name });
      expect(within(region).getByRole("article", { name: "Build something worth sharing. goal card" })).toHaveClass("tempo-card");
      expect(within(region).getByText("A goal you accomplished")).toBeInTheDocument();
      expect(within(region).getByText("12")).toBeInTheDocument();
    }
  });

  it("offers an explicit Foil tilt control and disables posing in still mode", async () => {
    const user = userEvent.setup();
    render(<CardMaterialsStudy />);
    const tilt = screen.getByRole("button", { name: "Tilt Foil Print" });
    await user.click(tilt);
    expect(tilt).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("checkbox", { name: "Still mode" }));
    for (const button of screen.getAllByRole("button", { name: /^Tilt / })) expect(button).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Tilt Woven Paper" })).not.toBeInTheDocument();
  });

  it("honors OS reduced motion for every dimensional concept", () => {
    preference.reduced = true;
    render(<CardMaterialsStudy />);
    const still = screen.getByRole("checkbox", { name: "Still mode" });
    expect(still).toBeChecked();
    expect(still).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: /^Tilt / })) expect(button).toBeDisabled();
  });

  it("lets keyboard users pose and restore each new premium card", async () => {
    const user = userEvent.setup();
    render(<CardMaterialsStudy />);
    for (const name of ["Pearl Reserve", "Ruby Cabochon", "Sapphire Prism", "Platinum Mirror"]) {
      const region = screen.getByRole("region", { name });
      expect(within(region).getByRole("article", { name: "Goal card preview" })).toHaveClass("tempo-card");
      const tilt = within(region).getByRole("button", { name: `Tilt ${name}` });
      tilt.focus();
      await user.keyboard("{Enter}");
      expect(tilt).toHaveAttribute("aria-pressed", "true");
      expect(tilt).toHaveTextContent("Rest");
      await user.keyboard("{Enter}");
      expect(tilt).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("updates the goal color and shared card for all category-responsive finishes", async () => {
    const user = userEvent.setup();
    render(<CardMaterialsStudy />);
    for (const sample of ["0", "1", "2"]) {
      await user.selectOptions(screen.getByRole("combobox", { name: "Sample goal" }), sample);
      const expected = ["#10b981", "#8b5cf6", "#f43f5e"][Number(sample)];
      for (const name of ["Prismatic Pearl", "Chromatic Foil", "Anodized Alloy"]) {
        const region = screen.getByRole("region", { name });
        const card = within(region).getByRole("article", { name: "Goal card preview" });
        expect(card.style.getPropertyValue("--goal-color")).toBe(expected);
        expect(card.closest<HTMLElement>("[data-material]")!.style.getPropertyValue("--material-color")).toBe(expected);
        expect(within(region).getByRole("button", { name: `Reset ${name}` })).toBeEnabled();
      }
    }
  });

  it("applies every material to challenge, leaderboard, profile, and object studies", async () => {
    const user = userEvent.setup();
    render(<CardMaterialsStudy />);

    await user.click(screen.getByRole("tab", { name: "02 In the app" }));
    expect(screen.getByRole("region", { name: "Challenge card" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Leaderboard card" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Profile trading card" })).toBeInTheDocument();
    const team = screen.getByRole("region", { name: "Team membership card" });
    expect(within(team).getByRole("progressbar", { name: "Team weekly sessions" })).toHaveAttribute("aria-valuenow", "18");
    await user.selectOptions(screen.getByRole("combobox", { name: "Category color" }), "1");
    expect(within(team).getByRole("article").closest<HTMLElement>("[data-material]")!.style.getPropertyValue("--material-color")).toBe("#8b5cf6");
    await user.click(within(team).getByRole("button", { name: "Tilt Team membership card" }));
    expect(within(team).getByRole("button", { name: "Tilt Team membership card" })).toHaveAttribute("aria-pressed", "true");
    await user.selectOptions(screen.getByRole("combobox", { name: "Material" }), "7");
    expect(screen.getByRole("combobox", { name: "Material" })).toHaveDisplayValue("Sapphire Prism");

    await user.click(screen.getByRole("tab", { name: "03 Trophies & objects" }));
    expect(screen.getByRole("region", { name: "Annual achievement trophy" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Milestone medal" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Momentum compass" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Summit award" })).toBeInTheDocument();
    const medal = screen.getByRole("region", { name: "Milestone medal" });
    const sculpture = within(medal).getByRole("img");
    expect(sculpture.closest("[data-material]")).toHaveAttribute("data-material", "sapphire");
    expect(sculpture.closest<HTMLElement>("[data-material]")!.style.getPropertyValue("--material-color")).toBe("#8b5cf6");
    const definitions = Array.from(document.querySelectorAll("svg defs [id]"), element => element.id);
    expect(new Set(definitions).size).toBe(definitions.length);
    await user.click(within(medal).getByRole("button", { name: "Tilt Milestone medal" }));
    expect(within(medal).getByRole("button", { name: "Tilt Milestone medal" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("checkbox", { name: "Still mode" }));
    for (const button of screen.getAllByRole("button", { name: /^Tilt / })) expect(button).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Material" })).toHaveDisplayValue("Sapphire Prism");
  });

});
