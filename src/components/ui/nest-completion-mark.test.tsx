import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NestCompletionMark } from "@/components/ui/nest-completion-mark";

describe("NestCompletionMark", () => {
  it("nests a filled square only when complete", () => {
    const { rerender, container } = render(<NestCompletionMark done={false} />);
    expect(container.querySelector('[data-completion-mark="nest"]')).toHaveAttribute(
      "data-completed",
      "false"
    );
    expect(container.querySelectorAll("rect")).toHaveLength(2);

    rerender(<NestCompletionMark done />);
    expect(container.querySelector('[data-completion-mark="nest"]')).toHaveAttribute(
      "data-completed",
      "true"
    );
    expect(container.querySelectorAll("rect")).toHaveLength(2);

    const outer = container.querySelector("rect");
    expect(outer).toHaveAttribute("x", "2.5");
    expect(outer).toHaveAttribute("width", "19");
    expect(Number(outer?.getAttribute("x")) + Number(outer?.getAttribute("width"))).toBeLessThanOrEqual(24);
  });
});
