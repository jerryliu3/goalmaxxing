import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTileGlide } from "./use-tile-glide";

// jsdom has no layout: each piece reports the offsets its data attributes name.
function Probe({ lead }: { lead: boolean }) {
  const ref = useTileGlide(lead);
  return (
    <article ref={ref}>
      <span data-glide="count" data-y={lead ? 0 : 20} data-size={lead ? 17 : 10.5}>2 of 3</span>
      <span data-glide="name" data-y={lead ? 20 : 36}>Long run</span>
      {lead ? null : <span data-glide="time" data-y={20}>07:30</span>}
    </article>
  );
}

describe("useTileGlide", () => {
  const animate = vi.fn();
  beforeEach(() => {
    animate.mockReset();
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    Object.defineProperty(HTMLElement.prototype, "offsetParent", {
      get() { return this.parentElement; },
      configurable: true,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetTop", {
      get() { return Number(this.dataset.y ?? 0); },
      configurable: true,
    });
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element) => ({ fontSize: `${(element as HTMLElement).dataset.size ?? 10.5}px` }) as CSSStyleDeclaration
    );
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does nothing on first render", () => {
    render(<Probe lead={false} />);
    expect(animate).not.toHaveBeenCalled();
  });

  it("glides each piece from its old spot, scaling the count, when the mode flips", () => {
    const { rerender } = render(<Probe lead={false} />);
    rerender(<Probe lead />);
    const byText = (text: string) =>
      animate.mock.calls[animate.mock.contexts.findIndex((element) => (element as HTMLElement).textContent === text)];
    expect(byText("2 of 3")?.[0][0].transform).toBe(`translate(0px, 20px) scale(${10.5 / 17})`);
    expect(byText("Long run")?.[0][0].transform).toBe("translate(0px, 16px) scale(1)");
  });

  it("fades in a piece that had no earlier spot", () => {
    const { rerender } = render(<Probe lead />);
    rerender(<Probe lead={false} />);
    const index = animate.mock.contexts.findIndex((element) => (element as HTMLElement).textContent === "07:30");
    expect(animate.mock.calls[index][0]).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });
});
