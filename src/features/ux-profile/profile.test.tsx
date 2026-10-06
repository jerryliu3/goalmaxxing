import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canSee,
  PIN_LIMIT,
  PROFILE_CONCEPTS,
  profileGoals,
  togglePin,
} from "@/features/ux-profile/model";
import { OwnerPageConcept } from "@/features/ux-profile/owner-page-concept";
import { PinFromGrowthConcept } from "@/features/ux-profile/pin-from-growth-concept";
import { ProfileIndex } from "@/features/ux-profile/profile-index";
import { PublicProfileView } from "@/features/ux-profile/public-profile-view";
import { CURRENT_GOALS, INITIAL_DRAFT, PROFILE } from "@/features/ux-profile/seed";

vi.mock("@/features/ux-brand/card-materials/material-stage", () => ({
  MaterialStage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

const PRIVATE_GOAL = "Therapy every other week";

describe("profile study model", () => {
  it("caps pins at the limit and always allows unpinning", () => {
    const full = ["a", "b", "c"];
    expect(PIN_LIMIT).toBe(3);
    expect(togglePin(full, "d")).toEqual({ pins: full, blocked: true });
    expect(togglePin(full, "b")).toEqual({ pins: ["a", "c"], blocked: false });
    expect(togglePin(["a"], "d")).toEqual({ pins: ["a", "d"], blocked: false });
  });

  it("never shows private or unfeatured goals to visitors", () => {
    const featured = CURRENT_GOALS.map((goal) => goal.id);
    const visitor = profileGoals(CURRENT_GOALS, featured, "public");
    expect(visitor.map((row) => row.goal.title)).not.toContain(PRIVATE_GOAL);
    expect(profileGoals(CURRENT_GOALS, featured, "owner")).toHaveLength(CURRENT_GOALS.length);
  });

  it("resolves section audiences per viewer", () => {
    expect(canSee("friends", "public")).toBe(false);
    expect(canSee("friends", "friend")).toBe(true);
    expect(canSee("only-me", "friend")).toBe(false);
    expect(canSee("only-me", "owner")).toBe(true);
  });
});

describe("profile study index", () => {
  it("lists every concept and the new tab map", () => {
    render(<ProfileIndex />);
    for (const concept of PROFILE_CONCEPTS) {
      expect(screen.getByRole("link", { name: `Open ${concept.name}` })).toHaveAttribute(
        "href",
        `/ux/profile/${concept.slug}`
      );
    }
    expect(screen.getByRole("heading", { name: "Growth" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Goal library" })).toBeInTheDocument();
  });
});

describe("PublicProfileView", () => {
  const owner = {
    onBioChange: vi.fn(),
    sectionAction: () => <button type="button">Edit showcase</button>,
  };

  it("hides the private goal and edit affordances from visitors", () => {
    render(<PublicProfileView profile={PROFILE} draft={INITIAL_DRAFT} viewer="public" owner={owner} />);
    expect(screen.queryByText(PRIVATE_GOAL)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit bio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit showcase" })).not.toBeInTheDocument();
    expect(screen.getByText("Run 3 days a week")).toBeInTheDocument();
  });

  it("shows owners the private goal and edit affordances", () => {
    render(<PublicProfileView profile={PROFILE} draft={INITIAL_DRAFT} viewer="owner" owner={owner} />);
    expect(screen.getByText(PRIVATE_GOAL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit bio" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Edit showcase" }).length).toBeGreaterThan(0);
  });
});

describe("profile concepts", () => {
  it("A: preview as visitor drops edit controls and private goals", async () => {
    const user = userEvent.setup();
    render(<OwnerPageConcept />);
    expect(screen.getByText(PRIVATE_GOAL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit showcase" })).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: /preview as visitor/i }));

    expect(screen.getByText(/this is what others see/i)).toBeInTheDocument();
    expect(screen.queryByText(PRIVATE_GOAL)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit showcase" })).not.toBeInTheDocument();
  });

  it("C: a fourth pin is refused until one is unpinned", async () => {
    const user = userEvent.setup();
    render(<PinFromGrowthConcept />);
    const level6 = screen.getByRole("button", { name: "Show Level 6 unlocked on profile" });

    await user.click(level6);
    expect(level6).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/unpin one/i);

    await user.click(screen.getByRole("button", { name: "Show Level 8 unlocked on profile" }));
    await user.click(level6);
    expect(level6).toHaveAttribute("aria-pressed", "true");
  });
});
