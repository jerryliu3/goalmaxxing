import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SolidLettering } from "./solid-lettering";

afterEach(cleanup);

it("keeps one readable label and matching multiline geometry when text changes", () => {
  const { container, rerender } = render(
    <h2>
      <SolidLettering>
        The Early
        <br />
        Hours Club
      </SolidLettering>
    </h2>,
  );
  expect(
    screen.getByRole("heading", { name: /The Early\s*Hours Club/ }),
  ).toBeInTheDocument();
  const walls = container.querySelectorAll<HTMLElement>("[data-glyphs]");
  expect(walls.length).toBeGreaterThan(1);
  for (const wall of walls) {
    expect(wall).toHaveAttribute("aria-hidden", "true");
    expect(wall).toHaveAttribute("data-glyphs", "The Early\nHours Club");
    expect(wall.textContent).toBe("");
  }
  rerender(
    <h2>
      <SolidLettering>Build something worth sharing.</SolidLettering>
    </h2>,
  );
  expect(screen.getAllByText("Build something worth sharing.")).toHaveLength(1);
  for (const wall of container.querySelectorAll("[data-glyphs]")) {
    expect(wall).toHaveAttribute(
      "data-glyphs",
      "Build something worth sharing.",
    );
  }
});
