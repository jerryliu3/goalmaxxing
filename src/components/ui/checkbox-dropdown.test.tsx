import { cleanup, render, screen } from "@testing-library/react";
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

describe("CheckboxDropdown", () => {
  it("keeps portaled checkbox items clickable inside a modal dialog", async () => {
    const user = userEvent.setup();
    render(<DialogWithDropdown />);

    await user.click(screen.getByRole("button", { name: "All end months" }));

    const menu = await screen.findByRole("listbox");
    expect(menu).toHaveAttribute("data-slot", "checkbox-dropdown-menu");
    expect(menu).toHaveStyle({ pointerEvents: "auto" });
    expect(document.body.style.pointerEvents).toBe("none");

    await user.click(screen.getByRole("checkbox", { name: "August" }));

    expect(screen.getByTestId("selection")).toHaveTextContent("aug");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
