import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFittedTitle } from "./use-fitted-title";

const LINE = 10;
// Ten characters fill a line at full size, so lines grow with text length times scale.
function laidOutHeight(element: HTMLElement) {
  const scale = Number(element.style.getPropertyValue("--title-scale") || 1);
  return Math.ceil(((element.textContent ?? "").length * scale) / 10) * LINE;
}

function Title({ text }: { text: string }) {
  const { ref, scale } = useFittedTitle(text);
  return (
    <h2 ref={ref} data-scale={scale} style={{ lineHeight: `${LINE}px` }}>
      {text}
    </h2>
  );
}

describe("useFittedTitle", () => {
  let width = 100;
  beforeEach(() => {
    width = 100;
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return laidOutHeight(this);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("keeps a title that fits two lines at full size", () => {
    render(<Title text="Read every day" />);
    expect(screen.getByRole("heading")).toHaveAttribute("data-scale", "1");
  });

  it("shrinks a longer title until it fits two lines, without cutting it", () => {
    const text = "Practice presentations twelve times more";
    render(<Title text={text} />);
    const heading = screen.getByRole("heading");
    expect(heading).toHaveTextContent(text);
    const scale = Number(heading.dataset.scale);
    // Four lines' worth of text at full size: the largest scale that fits two is a half.
    expect(scale).toBeLessThanOrEqual(0.5);
    expect(scale).toBeGreaterThan(0.48);
    expect(laidOutHeight(heading)).toBeLessThanOrEqual(2 * LINE);
  });

  it("has no floor, so even a very long title stays on two lines", () => {
    render(<Title text={"Learn ".repeat(60)} />);
    expect(laidOutHeight(screen.getByRole("heading"))).toBeLessThanOrEqual(2 * LINE);
  });

  it("refits when the title changes", () => {
    const { rerender } = render(<Title text="Practice presentations twelve times more" />);
    rerender(<Title text="Run" />);
    expect(screen.getByRole("heading")).toHaveAttribute("data-scale", "1");
  });

  it("leaves a title with no layout yet at full size", () => {
    width = 0;
    render(<Title text="Practice presentations twelve times more" />);
    expect(screen.getByRole("heading")).toHaveAttribute("data-scale", "1");
  });
});
