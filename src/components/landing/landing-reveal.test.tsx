import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingReveal } from "@/components/landing/landing-reveal";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("LandingReveal", () => {
  it("starts visible so server HTML matches the first client paint", () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return [];
        }
      }
    );

    render(
      <LandingReveal>
        <p>Inside Goalmaxxing peek</p>
      </LandingReveal>
    );

    expect(screen.getByText("Inside Goalmaxxing peek")).toBeVisible();
  });
});
