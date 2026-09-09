import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomSheet } from "@/components/ui/bottom-sheet";

describe("BottomSheet", () => {
  afterEach(() => {
    cleanup();
  });

  it("slides content up from the bottom with a title", () => {
    render(
      <BottomSheet open onOpenChange={vi.fn()} title="Preferences">
        <p>Sheet body</p>
      </BottomSheet>
    );

    expect(screen.getByTestId("app-bottom-sheet")).toHaveClass("rounded-t-3xl");
    expect(screen.getByRole("dialog", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByText("Sheet body")).toBeVisible();
  });

  it("notifies the caller when dismissed", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="Preferences">
        <p>Sheet body</p>
      </BottomSheet>
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
