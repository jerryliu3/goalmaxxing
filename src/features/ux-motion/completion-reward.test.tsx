import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompletionStamp, CompletionXpBar } from "./completion-reward";

describe("completion reward prototype", () => {
  it("shows the earned XP amount after a completion", () => {
    render(<CompletionXpBar active still />);

    expect(screen.getByText("344 XP")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "XP toward next level" })).toHaveAttribute("aria-valuenow", "14.666666666666666");
  });

  it("renders the completion stamp over the source goal", () => {
    render(<CompletionStamp active still />);

    expect(screen.getByLabelText("Completed stamp")).toHaveTextContent("COMPLETE");
    expect(screen.getByText("18 SEP · +24 XP")).toBeInTheDocument();
  });
});
