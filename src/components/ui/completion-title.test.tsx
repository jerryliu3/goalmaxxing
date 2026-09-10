import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CompletionTitle } from "@/components/ui/completion-title";

describe("CompletionTitle", () => {
  afterEach(() => {
    cleanup();
  });
  it("marks completed titles for the strike animation", () => {
    render(<CompletionTitle completed>Run</CompletionTitle>);
    expect(screen.getByTestId("completion-title")).toHaveAttribute(
      "data-completed",
      "true"
    );
    expect(screen.getByTestId("completion-title")).toHaveClass("gm-completion-title");
  });

  it("marks incomplete titles so the strike can reverse", () => {
    render(<CompletionTitle completed={false}>Run</CompletionTitle>);
    expect(screen.getByTestId("completion-title")).toHaveAttribute(
      "data-completed",
      "false"
    );
  });
});
