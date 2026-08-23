import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DemoBanner } from "@/features/demo/demo-banner";

describe("DemoBanner", () => {
  afterEach(() => {
    cleanup();
  });

  it("explains the demo and offers conversion exits", () => {
    render(<DemoBanner />);
    expect(screen.getByText(/you're exploring a demo/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Create account" }).getAttribute("href")
    ).toBe("/signup");
    expect(
      screen.getByRole("link", { name: "Back to website" }).getAttribute("href")
    ).toBe("/");
  });
});
