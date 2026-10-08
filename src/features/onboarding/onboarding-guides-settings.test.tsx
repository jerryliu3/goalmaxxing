import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnboardingGuidesSettings } from "@/features/onboarding/onboarding-guides-settings";

describe("OnboardingGuidesSettings", () => {
  afterEach(() => {
    cleanup();
  });

  it("groups app intro and page guides with row actions", () => {
    render(<OnboardingGuidesSettings />);

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Getting started")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Replay" })[0]).toBeInTheDocument();

    expect(screen.getByText("Tab tour")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();
    expect(screen.getByText("Agenda")).toBeInTheDocument();
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.queryByText("Tasks")).toBeNull();
    expect(screen.queryByText("You")).toBeNull();
    expect(screen.queryByText("Checklist")).toBeNull();
    expect(screen.getAllByRole("link", { name: "Replay" })[0]).toHaveAttribute(
      "href",
      "/calendar?onboarding=planner.calendar"
    );

    expect(screen.queryByText("Starter packs")).toBeNull();
    expect(screen.queryByRole("link", { name: "Open" })).toBeNull();

    expect(screen.queryByRole("button", { name: "Reset page guides" })).toBeNull();
  });
});
