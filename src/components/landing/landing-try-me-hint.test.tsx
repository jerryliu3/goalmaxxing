import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingTryMeHint } from "@/components/landing/landing-try-me-hint";

describe("LandingTryMeHint", () => {
  it("places the arrow before Try me", () => {
    render(
      <div className="relative">
        <LandingTryMeHint />
      </div>
    );

    const hint = screen.getByTestId("landing-try-me");
    const icon = hint.querySelector("svg");

    expect(hint).toHaveTextContent("Try me");
    expect(icon).not.toBeNull();
    expect(hint.innerHTML.trim().startsWith("<svg")).toBe(true);
  });
});
