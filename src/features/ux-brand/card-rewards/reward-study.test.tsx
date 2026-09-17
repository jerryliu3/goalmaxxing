import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RewardStudy } from "./reward-study";
import { REWARD_CONCEPTS } from "./reward-model";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => preference.reduced }));
afterEach(() => { cleanup(); preference.reduced = false; });

describe("reward card study", () => {
  it("compares the real Tempo card and keeps each treatment synchronized", async () => {
    const user = userEvent.setup();
    render(<RewardStudy />);
    for (const concept of REWARD_CONCEPTS) {
      const region = screen.getByRole("region", { name: concept.name });
      expect(within(region).getByRole("article", { name: "Goal card preview" })).toHaveClass("tempo-card");
    }
    await user.type(screen.getByRole("textbox", { name: "Your reward" }), " together");
    await user.click(screen.getByRole("button", { name: "Almost earned" }));
    expect(screen.getByRole("status")).toHaveTextContent("11 / 12 completions");
    expect(screen.queryByText("Earned", { exact: true })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Complete one" }));
    expect(screen.getAllByText("Earned", { exact: true })).toHaveLength(REWARD_CONCEPTS.length);
    expect(screen.getAllByText("A weekend away together")).toHaveLength(REWARD_CONCEPTS.length);
    await user.click(screen.getByRole("button", { name: "Undo one completion" }));
    expect(screen.queryByText("Earned", { exact: true })).not.toBeInTheDocument();
  });

  it("resets the comparison on a target change and preserves the open goal cadence", async () => {
    const user = userEvent.setup();
    render(<RewardStudy />);
    await user.click(screen.getByRole("button", { name: "Complete one" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Reward after" }), "24");
    expect(screen.getByRole("status")).toHaveTextContent("0 / 24 completions");
    await user.selectOptions(screen.getByRole("combobox", { name: "Goal" }), "2");
    expect(screen.getByRole("status")).toHaveTextContent("0 / 12 successful weeks");
    await user.click(screen.getByRole("button", { name: "Almost earned" }));
    await user.click(screen.getByRole("button", { name: "Complete one" }));
    expect(screen.getAllByText("03")).toHaveLength(REWARD_CONCEPTS.length);
    expect(screen.queryByText("A goal you accomplished")).not.toBeInTheDocument();
  });

  it("offers keyboard tilt and respects still mode and reduced motion", async () => {
    const user = userEvent.setup();
    render(<RewardStudy />);
    const tilt = screen.getByRole("button", { name: "Tilt Illuminate" });
    tilt.focus();
    await user.keyboard("{Enter}");
    expect(tilt).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("checkbox", { name: "Still mode" }));
    for (const button of screen.getAllByRole("button", { name: /^Tilt / })) expect(button).toBeDisabled();
    cleanup();
    preference.reduced = true;
    render(<RewardStudy />);
    expect(screen.getByRole("checkbox", { name: "Still mode" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Still mode" })).toBeDisabled();
  });
});
