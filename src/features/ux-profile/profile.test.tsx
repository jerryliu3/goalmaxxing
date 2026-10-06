import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canSee,
  currentGoals,
  PIN_LIMIT,
  PROFILE_CONCEPTS,
  profileGoals,
  publicProfileUrl,
  togglePin,
} from "@/features/ux-profile/model";
import { OwnerPageConcept } from "@/features/ux-profile/owner-page-concept";
import { PinFromGrowthConcept } from "@/features/ux-profile/pin-from-growth-concept";
import { ProfileIndex } from "@/features/ux-profile/profile-index";
import { PublicProfileView } from "@/features/ux-profile/public-profile-view";
import { GOALS, INITIAL_DRAFT, PROFILE } from "@/features/ux-profile/seed";
import { SettingsPreviewConcept } from "@/features/ux-profile/settings-preview-concept";

vi.mock("@/features/ux-brand/card-materials/material-stage", () => ({
  MaterialStage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// The production card is a 3D material object; the study only asserts which goals get one.
vi.mock("@/features/goals/goal-progress-card", () => ({
  GoalProgressCard: ({ goal }: { goal: { title: string } }) => <p data-testid="goal-card">{goal.title}</p>,
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

  it("never puts private or unfeatured goals on a profile", () => {
    const featured = GOALS.map((goal) => goal.id);
    expect(profileGoals(PROFILE, featured).map((entry) => entry.goal.title)).not.toContain(PRIVATE_GOAL);
    expect(profileGoals(PROFILE, [])).toEqual([]);
  });

  it("builds the link with production's /user path on goalmaxxing.xyz", () => {
    expect(publicProfileUrl("mayaruns")).toBe("goalmaxxing.xyz/user/mayaruns");
  });

  it("selects and orders current goals with the Goals page logic", () => {
    // selectCurrentGoals: finished goals drop out, upcoming sorts last, then start date.
    expect(currentGoals(PROFILE, "owner").map((entry) => entry.goal.id)).toEqual([
      "goal-therapy",
      "goal-japanese",
      "goal-run",
      "goal-ship",
      "goal-cycle",
    ]);
    expect(currentGoals(PROFILE, "public").map((entry) => entry.goal.id)).not.toContain("goal-therapy");
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

  it("leads with E", () => {
    render(<ProfileIndex />);
    const [first] = screen.getAllByRole("link", { name: /^Open / });
    expect(first).toHaveAttribute("href", "/ux/profile/settings-preview");
    expect(within(first).getByText("Leading")).toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Copy link" })).not.toBeInTheDocument();
    expect(screen.getByText(publicProfileUrl("mayaruns"))).toBeInTheDocument();
    expect(screen.getAllByTestId("goal-card").map((card) => card.textContent)).toEqual([
      "Conversational Japanese",
      "Run 3 days a week",
      "Ship side project v2",
    ]);
  });

  it("shows owners edit affordances but still never the private goal", () => {
    render(<PublicProfileView profile={PROFILE} draft={INITIAL_DRAFT} viewer="owner" owner={owner} />);
    expect(screen.queryByText(PRIVATE_GOAL)).not.toBeInTheDocument();
    expect(screen.queryByText(/only you see these/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit bio" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Edit showcase" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });
});

describe("profile concepts", () => {
  it("A: preview as visitor drops edit controls and private goals", async () => {
    const user = userEvent.setup();
    render(<OwnerPageConcept />);
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

  describe("E: your profile, in Settings", () => {
    const box = () => screen.getByRole("region", { name: "Your public profile" });

    it("renders the full visitor profile in the settings box", () => {
      render(<SettingsPreviewConcept />);
      const card = box();
      expect(within(card).getByRole("article", { name: "Maya Chen membership card" })).toBeInTheDocument();
      expect(within(card).getByText("goalmaxxing.xyz/user/mayaruns")).toBeInTheDocument();
      expect(within(card).getByRole("heading", { name: "Your Goalmaxxing profile" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Copy link" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Edit profile" })).toBeInTheDocument();
      expect(within(card).getByRole("region", { name: "About" })).toBeInTheDocument();
      expect(within(card).getByRole("region", { name: "Showcase" })).toBeInTheDocument();
      expect(within(card).getAllByTestId("goal-card").map((goal) => goal.textContent)).toEqual([
        "Conversational Japanese",
        "Run 3 days a week",
        "Ship side project v2",
      ]);
      expect(within(card).queryByText(PRIVATE_GOAL)).not.toBeInTheDocument();
      expect(screen.queryByText(/only you see these/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Preview & edit" })).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("view mode is the clean read-only card with no edit affordances", () => {
      render(<SettingsPreviewConcept />);
      const card = box();
      expect(within(card).queryByRole("button", { name: "Edit username" })).not.toBeInTheDocument();
      expect(within(card).queryByRole("button", { name: "Edit display name" })).not.toBeInTheDocument();
      expect(within(card).queryByRole("button", { name: "Change profile photo" })).not.toBeInTheDocument();
      expect(within(card).queryByRole("button", { name: "Edit bio" })).not.toBeInTheDocument();
      expect(within(card).queryByRole("button", { name: "Choose goals" })).not.toBeInTheDocument();
    });

    it("Edit profile turns the same box into the editor, and Done exits", async () => {
      const user = userEvent.setup();
      render(<SettingsPreviewConcept />);

      await user.click(screen.getByRole("button", { name: "Edit profile" }));

      const card = box();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(within(card).getByRole("status")).toHaveTextContent(
        "Editing — changes are visible to everyone when you press Done"
      );
      expect(within(card).getByRole("button", { name: "Edit username" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Edit display name" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Change profile photo" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Edit bio" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Choose goals" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Change pin: Level 8 unlocked" })).toBeInTheDocument();
      expect(within(card).queryByRole("button", { name: "Edit profile" })).not.toBeInTheDocument();
      expect(within(card).queryByText(PRIVATE_GOAL)).not.toBeInTheDocument();
      expect(within(card).queryByText(/only you see these/i)).not.toBeInTheDocument();

      await user.click(within(card).getByRole("button", { name: "Done" }));

      expect(within(box()).getByRole("button", { name: "Edit profile" })).toBeInTheDocument();
      expect(within(box()).queryByRole("button", { name: "Edit bio" })).not.toBeInTheDocument();
      expect(within(box()).queryByRole("button", { name: "Edit username" })).not.toBeInTheDocument();
    });

    it("Done keeps edits and Cancel discards them", async () => {
      const user = userEvent.setup();
      render(<SettingsPreviewConcept />);

      await user.click(screen.getByRole("button", { name: "Edit profile" }));
      await user.click(screen.getByRole("button", { name: "Edit bio" }));
      await user.clear(screen.getByRole("textbox", { name: "Bio" }));
      await user.type(screen.getByRole("textbox", { name: "Bio" }), "Kept");
      await user.click(screen.getByRole("button", { name: "Done" }));
      expect(within(box()).getByText("Kept")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Edit profile" }));
      await user.click(screen.getByRole("button", { name: "Edit bio" }));
      await user.type(screen.getByRole("textbox", { name: "Bio" }), " and dropped");
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(within(box()).getByText("Kept")).toBeInTheDocument();
      expect(within(box()).queryByText("Kept and dropped")).not.toBeInTheDocument();
    });

    it("the featured-goals chooser lists the private goal but it never reaches the profile", async () => {
      const user = userEvent.setup();
      render(<SettingsPreviewConcept />);
      await user.click(screen.getByRole("button", { name: "Edit profile" }));

      await user.click(screen.getByRole("button", { name: "Choose goals" }));

      const picker = screen.getByRole("dialog", { name: "Featured goals" });
      expect(within(picker).getByRole("checkbox", { name: new RegExp(PRIVATE_GOAL) })).toBeDisabled();
      // The open picker hides the page from the accessibility tree.
      const settingsBox = screen.getByRole("region", { name: "Your public profile", hidden: true });
      expect(within(settingsBox).queryByText(PRIVATE_GOAL)).not.toBeInTheDocument();
    });

    it("a pin slot opens the showcase picker", async () => {
      const user = userEvent.setup();
      render(<SettingsPreviewConcept />);
      await user.click(screen.getByRole("button", { name: "Edit profile" }));

      await user.click(screen.getByRole("button", { name: "Change pin: Level 8 unlocked" }));

      expect(screen.getByRole("dialog", { name: "Edit showcase" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Show Level 8 unlocked on profile" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });
});
