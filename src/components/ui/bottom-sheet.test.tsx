import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomSheet, SidePanel } from "@/components/ui/bottom-sheet";

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
    expect(document.querySelector('[aria-hidden="true"].rounded-full')).toBeTruthy();
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

  it("slides a full-height side panel from the right", () => {
    render(
      <SidePanel open onOpenChange={vi.fn()} title="Preferences">
        <p>Panel body</p>
      </SidePanel>
    );

    expect(screen.getByTestId("app-side-panel")).toHaveClass("rounded-none");
    expect(screen.getByRole("dialog", { name: "Preferences" })).toBeInTheDocument();
    expect(document.querySelector('[aria-hidden="true"].rounded-full')).toBeNull();
  });
});
