import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps a bordered chip on outline text buttons", () => {
    render(
      <Button type="button" variant="outline">
        Filters
      </Button>
    );
    expect(screen.getByRole("button", { name: "Filters" })).toHaveClass(
      "border-border"
    );
  });

  it("renders outline icon buttons without a bordered chip", () => {
    render(
      <Button type="button" variant="outline" size="icon-sm" aria-label="Filters" />
    );
    const button = screen.getByRole("button", { name: "Filters" });
    expect(button).toHaveClass("border-0");
    expect(button).not.toHaveClass("border-border");
  });
});
