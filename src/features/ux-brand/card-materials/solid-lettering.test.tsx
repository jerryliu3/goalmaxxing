import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { MATERIAL_SAMPLES } from "./materials";
import { SolidLettering, renderSolidLettering } from "./solid-lettering";

afterEach(cleanup);

it("keeps one readable label and matching multiline geometry when text changes", () => {
  const { container, rerender } = render(<h2><SolidLettering>The Early<br />Hours Club</SolidLettering></h2>);
  expect(screen.getByRole("heading", { name: "The Early Hours Club" })).toBeInTheDocument();
  const walls = container.querySelectorAll<HTMLElement>("[data-glyphs]");
  expect(walls.length).toBeGreaterThan(1);
  for (const wall of walls) {
    expect(wall).toHaveAttribute("aria-hidden", "true");
    expect(wall).toHaveAttribute("data-glyphs", "The Early\nHours Club");
    expect(wall.textContent).toBe("");
  }
  rerender(<h2><SolidLettering>Build something worth sharing.</SolidLettering></h2>);
  expect(screen.getAllByText("Build something worth sharing.")).toHaveLength(1);
  for (const wall of container.querySelectorAll("[data-glyphs]")) {
    expect(wall).toHaveAttribute("data-glyphs", "Build something worth sharing.");
  }
});

it("leaves production typography unchanged and embosses number, period, and title only", () => {
  const fields = MATERIAL_SAMPLES[0].fields;
  const { container, rerender } = render(<TempoGoalCard fields={fields} />);
  expect(container.querySelector("[data-lettering-solid]")).toBeNull();
  const text = screen.getByRole("article").textContent;
  rerender(<TempoGoalCard fields={fields} renderLettering={renderSolidLettering} />);
  expect(screen.getByRole("article").textContent).toBe(text);
  expect(container.querySelectorAll('[data-lettering-solid="display"]')).toHaveLength(1);
  expect(container.querySelectorAll('[data-lettering-solid="title"]')).toHaveLength(1);
  expect(container.querySelector('[data-lettering-solid="supporting"] [data-glyphs]')).toHaveAttribute("data-glyphs", "days\na week");
  const category = container.querySelector(".tempo-card-period");
  expect(category?.querySelector("[data-lettering-solid]")).toBeNull();
  expect(category?.textContent).toMatch(/./);
});
