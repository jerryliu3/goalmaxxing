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
    expect(board("kiln").style.getPropertyValue("--job-place-fill")).toBe("var(--hue-ink)");

    await user.click(within(mixes).getByRole("radio", { name: /selection · tint/i }));
    expect(board("kiln").style.getPropertyValue("--job-place-fill")).toBe("var(--hue-accent-tint)");
    expect(board("kiln").style.getPropertyValue("--job-act-fill")).toBe("var(--hue-identity)");
  });

  it("marks a hand-tuned mix as custom", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    await expand(user, "Jobs");
    const focusTone = screen.getByRole("radiogroup", { name: "Focus tone" });
    await user.click(within(focusTone).getByRole("radio", { name: "Accent" }));
    expect(screen.getByText("Custom mix.")).toBeInTheDocument();
  });

  it("loads the proposal's accents, dropping them for tonal themes", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    await user.click(within(screen.getByRole("radiogroup", { name: "Mix" })).getByRole("radio", { name: /proposal/i }));
    expect(screen.getByRole("combobox", { name: "Original accent" })).toHaveValue("none");
    expect(screen.getByRole("combobox", { name: "Kiln accent" })).toHaveValue("registry");
    expect(screen.getByRole("combobox", { name: "Pitlane accent" })).toHaveValue("registry");
    expect(screen.getByRole("combobox", { name: "Bloodstone accent" })).toHaveValue("none");
    expect(board("original").style.getPropertyValue("--job-place-fill")).toBe("var(--hue-selected)");
    expect(board("kiln").style.getPropertyValue("--job-place-fill")).toBe("var(--hue-accent)");
  });

  it("applies a theme's accent to every board for that theme", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Original accent" }), "petroleum");
    for (const element of screen.getAllByTestId("hue-board-original")) {
      expect(element.style.getPropertyValue("--hue-accent")).toBe("#246b78");
      expect(element.style.getPropertyValue("--hue-accent-tint")).toBe("#c8e3e4");
    }
  });

  it("renders every registered theme and offers each one an accent or none", async () => {
    const user = userEvent.setup();
    render(<SecondHueStudy />);
    for (const id of ["original", "gazetteer", "undertow", "kiln", "court", "opaline", "bloodstone", "pitlane"]) {
      expect(screen.getAllByTestId(`hue-board-${id}`).length).toBeGreaterThan(0);
    }
    await expand(user, "Theme");
    await user.click(within(screen.getByRole("radiogroup", { name: "Theme" })).getByRole("radio", { name: "Centre Court" }));
    const courtAccents = screen.getByRole("radiogroup", { name: "Centre Court accent choices" });
    expect(within(courtAccents).getAllByRole("radio").map((radio) => radio.textContent)).toEqual(["Registry", "No accent"]);
  });
});
