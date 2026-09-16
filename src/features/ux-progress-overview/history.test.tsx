import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { initialHistory, ProgressHistory } from "./history";

function Harness() {
  const [state, setState] = useState(initialHistory);
  return <ProgressHistory state={state} onChange={setState} />;
}

describe("Progress history prototype", () => {
  afterEach(cleanup);

  it("inspects same-day completions and narrows them to one goal", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByTitle("2026-09-01: 2 completions"));
    const day = screen.getByRole("region", { name: "Selected day" });
    expect(within(day).getByText(/Build strength/)).toBeInTheDocument();
    expect(within(day).getByText(/Read every day/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Build strength/ }));
    expect(screen.queryByRole("region", { name: "Selected day" })).not.toBeInTheDocument();
    await user.click(screen.getByTitle("2026-09-01: 1 completion"));
    expect(within(screen.getByRole("region", { name: "Selected day" })).queryByText(/Read every day/)).not.toBeInTheDocument();
  });

  it("follows a milestone to its month and date", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /Finish my thesis/ }));
    await user.click(screen.getByRole("button", { name: "Proposal" }));
    expect(screen.getByTitle("2026-08-27: 1 completion")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Selected day" })).getByRole("heading", { name: "August 27, 2026" })).toBeInTheDocument();
  });
});
