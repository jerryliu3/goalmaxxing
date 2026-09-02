import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

afterEach(() => {
  cleanup();
});

describe("SelectContent", () => {
  it("opens with popper positioning above nested dialog stacking", async () => {
    const user = userEvent.setup();
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alpha">Alpha</SelectItem>
        </SelectContent>
      </Select>
    );

    await user.click(screen.getByRole("combobox"));
    const content = document.querySelector("[data-slot=select-content]");
    expect(content).toBeTruthy();
    expect(content).toHaveAttribute("data-align-trigger", "false");
    expect(content).toHaveClass("z-[200]");
  });
});
