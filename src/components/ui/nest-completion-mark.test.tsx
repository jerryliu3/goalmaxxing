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
    expect(container.querySelectorAll("rect")).toHaveLength(1);

    rerender(<NestCompletionMark done />);
    expect(container.querySelector('[data-completion-mark="nest"]')).toHaveAttribute(
      "data-completed",
      "true"
    );
    expect(container.querySelectorAll("rect")).toHaveLength(2);
  });
});
