import { describe, expect, it } from "vitest";
import type {
  PublicProfileBundle,
  PublicProfileCurrentGoal,
} from "@cadence/shared/social/public-profile";
import {
  buildPublicProfileUpdate,
  draftFromBundle,
  isProfileDraftDirty,
  resolveProfileContent,
  togglePin,
} from "@/features/social/public-profile/profile-draft";

function goal(id: string, flags: Partial<PublicProfileCurrentGoal> = {}) {
  return { id, title: id, isPrivate: false, featuredOnProfile: true, ...flags } as PublicProfileCurrentGoal;
}

const medal = { kind: "medal" as const, ref: "award-1", level: 3, title: "Level 3", unlockedAt: "2026-05-01T00:00:00Z" };
const record = { kind: "record" as const, ref: "rec-level", label: "Highest level", value: "3", hint: "900 XP total" };

const bundle = {
  bio: "Running toward a spring half.",
  showcase: [medal],
  showcaseCatalog: { medals: [medal], goals: [], records: [record] },
  currentGoals: [
    goal("shown"),
    goal("hidden", { featuredOnProfile: false }),
    goal("secret", { isPrivate: true }),
  ],
} as unknown as PublicProfileBundle;

describe("public profile draft", () => {
  it("starts from what visitors see today", () => {
    expect(draftFromBundle(bundle)).toEqual({
      bio: "Running toward a spring half.",
      pins: [{ kind: "medal", ref: "award-1" }],
      featuredGoalIds: ["shown"],
    });
  });

  it("never renders a private goal, even if a draft lists it", () => {
    const content = resolveProfileContent(bundle, {
      bio: "",
      pins: [],
      featuredGoalIds: ["shown", "secret"],
    });
    expect(content.goals.map((entry) => entry.id)).toEqual(["shown"]);
  });

  it("resolves draft pins through the owner catalog", () => {
    const content = resolveProfileContent(bundle, {
      bio: "",
      pins: [{ kind: "record", ref: "rec-level" }, { kind: "medal", ref: "award-1" }],
      featuredGoalIds: [],
    });
    expect(content.showcase.map((item) => item.ref)).toEqual(["rec-level", "award-1"]);
  });

  it("caps pins at three with a notice", () => {
    const full = [
      { kind: "medal" as const, ref: "a" },
      { kind: "medal" as const, ref: "b" },
      { kind: "medal" as const, ref: "c" },
    ];
    expect(togglePin(full, { kind: "record", ref: "rec-level" })).toEqual({
      pins: full,
      notice: "You can pin 3. Unpin one to add another.",
    });
    expect(togglePin(full, { kind: "medal", ref: "b" }).pins.map((pin) => pin.ref)).toEqual(["a", "c"]);
  });

  it("sends only the featured flags that change", () => {
    const draft = { bio: "  New bio ", pins: [], featuredGoalIds: ["hidden"] };
    expect(buildPublicProfileUpdate(bundle, draft)).toEqual({
      p_bio: "New bio",
      p_pins: [],
      p_featured_goal_ids: ["hidden"],
      p_hidden_goal_ids: ["shown"],
    });
    expect(isProfileDraftDirty(bundle, draft)).toBe(true);
    expect(isProfileDraftDirty(bundle, draftFromBundle(bundle))).toBe(false);
  });
});
