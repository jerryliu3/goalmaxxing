import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FolioBook } from "./folio-book";
import type { GoalFolio } from "./folio-model";

afterEach(cleanup);

function folio(year: string): GoalFolio {
  return { year, completions: 12, entries: [] };
}

function cloth(year: string) {
  const { container } = render(<FolioBook folio={folio(year)} />);
  return container.querySelector<HTMLElement>("[data-folio-book]")!.style.getPropertyValue("--folio-cloth");
}

describe("FolioBook", () => {
  it("keys the cloth to the year so a book keeps its color as newer years arrive", () => {
    expect(cloth("2026")).toBe("#344f45");
    expect(cloth("2025")).toBe("#785a3a");
    expect(cloth("2027")).toBe("#4d5266");
    expect(cloth("2024")).toBe("#704d50");
    expect(cloth("2030")).toBe(cloth("2026"));
  });

  it("covers a month book with its month and year", () => {
    const { container } = render(<FolioBook folio={{ ...folio("2026"), month: "2026-10" }} />);
    expect(container).toHaveTextContent("2026 · MONTH IN GOALS");
    expect(container).toHaveTextContent("October");
    expect(container).toHaveTextContent("GOALMAXXING · OCTOBER 2026");
    expect(container).toHaveTextContent("A month ofshowing up.");
  });

  it("spells the month out and sizes long names to fit the cover", () => {
    const { getByText } = render(<FolioBook folio={{ ...folio("2026"), month: "2026-09" }} />);
    expect(getByText("September").style.getPropertyValue("--cover-chars")).toBe("9");
  });
});
