import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { SegmentedTabs } from "@/components/navigation/segmented-tabs";

const items = [
  { value: "current", label: "Current", controlsId: "current-panel" },
  { value: "past", label: "Past", controlsId: "past-panel" },
] as const;

describe("SegmentedTabs", () => {
  afterEach(cleanup);

  it("marks the active tab and reports selections", () => {
    const onChange = vi.fn();
    render(
      <SegmentedTabs
        items={items}
        value="current"
        onChange={onChange}
        label="Progress sections"
        highlightLayoutId="progress-view"
      />
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Current" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Past" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
    expect(screen.getByRole("tab", { name: "Past" })).toHaveAttribute(
      "aria-controls",
      "past-panel"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Past" }));
    expect(onChange).toHaveBeenCalledWith("past");
  });

  it("lays the tabs out in one column per item", () => {
    render(
      <SegmentedTabs
        items={items}
        value="past"
        onChange={() => {}}
        label="Progress sections"
        highlightLayoutId="progress-view"
      />
    );

    expect(screen.getByRole("tablist")).toHaveClass("grid-cols-2");
  });

  it("follows the selected UI style chrome", () => {
    render(
      <UiStyleProvider initialStyleId="gazetteer">
        <SegmentedTabs
          items={items}
          value="current"
          onChange={() => {}}
          label="Progress sections"
          highlightLayoutId="progress-view"
        />
      </UiStyleProvider>
    );

    expect(screen.getByRole("tab", { name: "Current" })).toHaveClass("text-primary");
  });
});
