import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SecondHueStudy } from "./study";

afterEach(cleanup);

function board(themeId: string) {
  return screen.getAllByTestId(`hue-board-${themeId}`)[0];
}

async function expand(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole("heading", { name: title }));
}

describe("second hue study", () => {
  it("starts on the shipped mix and re-points jobs when a mix is chosen", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    const mixes = screen.getByRole("radiogroup", { name: "Mix" });
    expect(within(mixes).getByRole("radio", { name: /one hue/i })).toHaveAttribute("aria-checked", "true");
    expect(board("original").style.getPropertyValue("--job-place-fill")).toBe("var(--hue-ink)");

    await user.click(within(mixes).getByRole("radio", { name: /where and when/i }));
    expect(board("original").style.getPropertyValue("--job-pick-fill")).toBe("var(--hue-second)");
    expect(board("original").style.getPropertyValue("--job-act-fill")).toBe("var(--hue-identity)");
  });

  it("marks a hand-tuned mix as custom", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    await expand(user, "Jobs");
    const focusTone = screen.getByRole("radiogroup", { name: "Focus and drafts tone" });
    await user.click(within(focusTone).getByRole("radio", { name: "Second" }));
    expect(screen.getByText("Custom mix.")).toBeInTheDocument();
  });

  it("offers Original candidates and applies one to every board for that theme", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    await expand(user, "Theme");
    const candidates = screen.getByRole("radiogroup", { name: "Original second hue" });
    await user.click(within(candidates).getByRole("radio", { name: /petroleum tint/i }));
    for (const element of screen.getAllByTestId("hue-board-original")) {
      expect(element.style.getPropertyValue("--hue-second")).toBe("#88bbbf");
    }
  });

  it("renders every registered theme in the comparison and flags fill-only hues", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    for (const id of ["original", "gazetteer", "undertow", "kiln", "court", "opaline", "bloodstone", "pitlane"]) {
      expect(screen.getAllByTestId(`hue-board-${id}`).length).toBeGreaterThan(0);
    }
    await expand(user, "Theme");
    await user.click(within(screen.getByRole("radiogroup", { name: "Theme" })).getByRole("radio", { name: "Centre Court" }));
    const courtHues = screen.getByRole("radiogroup", { name: "Centre Court second hue" });
    expect(within(courtHues).getAllByRole("radio").map((radio) => radio.textContent)).toEqual(["Registry", "Shade"]);
    expect(screen.getAllByText(/fails/).length).toBeGreaterThan(0);
  });
});
