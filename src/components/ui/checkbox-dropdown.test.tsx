import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CheckboxDropdown } from "./checkbox-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";

afterEach(() => {
  cleanup();
});

function DialogWithDropdown() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Filters</DialogTitle>
        <DialogDescription>Refine results</DialogDescription>
        <CheckboxDropdown
          options={[{ value: "aug", label: "August" }]}
          selectedValues={selected}
          onSelectedValuesChange={setSelected}
          placeholder="All end months"
          allLabel="All end months"
        />
        <p data-testid="selection">{selected.join(",") || "none"}</p>
      </DialogContent>
    </Dialog>
  );
}

function DialogWithSearchableDropdown() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Planner settings</DialogTitle>
        <DialogDescription>Reset goals</DialogDescription>
        <CheckboxDropdown
          enableSearch
          searchPlaceholder="Search goals"
          options={[
            { value: "alpha", label: "Alpha goal" },
            { value: "beta", label: "Beta goal" },
          ]}
          selectedValues={selected}
          onSelectedValuesChange={setSelected}
          placeholder="Select goals to reset"
          allLabel="No goals selected"
        />
      </DialogContent>
    </Dialog>
  );
}

describe("CheckboxDropdown", () => {
  it("keeps portaled checkbox items clickable inside a modal dialog", async () => {
    const user = userEvent.setup();
    render(<DialogWithDropdown />);

    await user.click(screen.getByRole("button", { name: "All end months" }));

    const menu = await screen.findByRole("listbox");
    const dialogContent = screen.getByRole("dialog");
    expect(menu).toHaveAttribute("data-slot", "checkbox-dropdown-menu");
    expect(dialogContent).toContainElement(menu);
    expect(document.body.style.pointerEvents).toBe("none");

    await user.click(screen.getByRole("checkbox", { name: "August" }));

    expect(screen.getByTestId("selection")).toHaveTextContent("aug");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("supports searching options inside a modal dialog", async () => {
    const user = userEvent.setup();
    render(<DialogWithSearchableDropdown />);

    await user.click(screen.getByRole("button", { name: "Select goals to reset" }));

    const menu = await screen.findByRole("listbox");
    const scrollRegion = menu.querySelector(".overflow-y-auto");
    expect(scrollRegion).not.toBeNull();

    const search = screen.getByRole("textbox", { name: "Search goals" });
    await user.click(search);
    expect(search).toHaveFocus();
    await user.type(search, "beta");

    expect(
      within(menu).queryByRole("checkbox", { name: "Alpha goal" })
    ).not.toBeInTheDocument();
    expect(
      within(menu).getByRole("checkbox", { name: "Beta goal" })
    ).toBeInTheDocument();
  });
});
