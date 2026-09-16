import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardMaterialsStudy } from "./card-materials-study";
import { MATERIALS } from "./materials";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => preference.reduced }));
afterEach(() => { cleanup(); preference.reduced = false; });

describe("card material comparison", () => {
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
});
