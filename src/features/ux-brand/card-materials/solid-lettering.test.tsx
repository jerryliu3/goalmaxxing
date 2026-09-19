import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { MATERIAL_SAMPLES } from "./materials";
import { renderSolidLettering } from "./solid-lettering";

afterEach(cleanup);

it("embosses production goal cards by default and keeps study opt-in equivalent", () => {
  const fields = MATERIAL_SAMPLES[0].fields;
  const { container, rerender } = render(<TempoGoalCard fields={fields} />);
  expect(container.querySelector("[data-lettering-solid]")).not.toBeNull();
  const text = screen.getByRole("article").textContent;
  rerender(
    <TempoGoalCard fields={fields} renderLettering={renderSolidLettering} />,
  );
  expect(screen.getByRole("article").textContent).toBe(text);
  expect(
    container.querySelectorAll('[data-lettering-solid="display"]'),
  ).toHaveLength(1);
  expect(
    container.querySelectorAll('[data-lettering-solid="title"]'),
  ).toHaveLength(1);
  expect(
    container.querySelector(
      '[data-lettering-solid="supporting"] [data-glyphs]',
    ),
  ).toHaveAttribute("data-glyphs", "days\na week");
  const category = container.querySelector(".tempo-card-period");
  expect(category?.querySelector("[data-lettering-solid]")).toBeNull();
  expect(category?.textContent).toMatch(/./);
});
