import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketingLandingPage from "./page";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => redirectMock(destination),
}));

vi.mock("@/components/landing/landing-page", () => ({
  LandingPage: () => null,
}));

describe("public root page routing", () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it("renders the landing page when no app search params are present", async () => {
    await MarketingLandingPage({
      searchParams: Promise.resolve({}),
    });

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects legacy day links into calendar day view", async () => {
    await MarketingLandingPage({
      searchParams: Promise.resolve({ day: "2026-08-04" }),
    });

    expect(redirectMock).toHaveBeenCalledWith(
      "/calendar?view=day&day=2026-08-04&month=2026-08"
    );
  });

  it("redirects legacy past tab links into Plan day", async () => {
    await MarketingLandingPage({
      searchParams: Promise.resolve({ tab: "past" }),
    });

    expect(redirectMock).toHaveBeenCalledWith("/calendar?view=day");
  });
});
