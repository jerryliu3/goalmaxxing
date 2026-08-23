import { APP_TABS } from "@cadence/shared/navigation/tabs";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JourneyBackdrop } from "@/components/journey/journey-backdrop.web";

vi.mock("motion/react", () => ({
  useReducedMotion: () => false,
}));

const pathnameMock = vi.fn(() => "/login");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("@/components/xp/xp-profile-provider", () => ({
  useXpProfile: () => ({
    profile: {
      totalXp: 420,
    },
  }),
}));

const enabledFlags = {
  journeyEnabled: true,
} as const;

describe("JourneyBackdrop", () => {
  afterEach(() => {
    cleanup();
    pathnameMock.mockReturnValue("/login");
  });

  it("renders poster-first fallback immediately", () => {
    render(<JourneyBackdrop flags={enabledFlags} />);
    const posterImage = document.querySelector("[data-journey-layer='poster'] img");
    expect(posterImage).toBeInTheDocument();
  });

  it("keeps poster visible while video is not ready", () => {
    render(<JourneyBackdrop flags={enabledFlags} />);
    const posterLayer = document.querySelector("[data-journey-layer='poster']");
    expect(posterLayer).toHaveClass("opacity-100");
  });

  it("fades poster after video can play on auth routes", () => {
    render(<JourneyBackdrop flags={enabledFlags} />);
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    if (!video) {
      return;
    }
    fireEvent.canPlay(video);
    const posterLayer = document.querySelector("[data-journey-layer='poster']");
    expect(posterLayer).toHaveClass("opacity-0");
  });

  it.each(["/login", "/signup", "/reset-password"])(
    "renders journey video on auth route %s",
    (pathname) => {
      pathnameMock.mockReturnValue(pathname);

      render(<JourneyBackdrop flags={enabledFlags} />);
      const video = document.querySelector("video");
      expect(video).not.toBeNull();
    }
  );

  it.each(APP_TABS.map((tab) => tab.href))(
    "prefers poster and skips video on in-app tab %s",
    (pathname) => {
      pathnameMock.mockReturnValue(pathname);

      render(<JourneyBackdrop flags={enabledFlags} />);
      const video = document.querySelector("video");
      expect(video).toBeNull();
    }
  );

  it("prefers poster and skips video on nested in-app routes", () => {
    pathnameMock.mockReturnValue("/goals/new");

    render(<JourneyBackdrop flags={enabledFlags} />);
    const video = document.querySelector("video");
    expect(video).toBeNull();
  });

  it("does not render video when journey is disabled", () => {
    render(
      <JourneyBackdrop
        flags={{
          ...enabledFlags,
          journeyEnabled: false,
        }}
      />
    );
    const video = document.querySelector("video");
    expect(video).toBeNull();
  });
});
