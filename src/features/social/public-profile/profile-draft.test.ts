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

  it("resolves draft pins through the owner catalog, records apart for the card", () => {
    const content = resolveProfileContent(bundle, {
      bio: "",
      pins: [{ kind: "record", ref: "rec-level" }, { kind: "medal", ref: "award-1" }],
      featuredGoalIds: [],
    });
    expect(content.records.map((item) => item.ref)).toEqual(["rec-level"]);
    expect(content.showcase.map((item) => item.ref)).toEqual(["award-1"]);
  });

  it("caps the showcase and the card records at three each", () => {
    const medals = [
      { kind: "medal" as const, ref: "a" },
      { kind: "medal" as const, ref: "b" },
      { kind: "medal" as const, ref: "c" },
    ];
    expect(togglePin(medals, { kind: "goal", ref: "g" })).toEqual({
      pins: medals,
      notice: "You can pin 3. Unpin one to add another.",
    });
    expect(togglePin(medals, { kind: "medal", ref: "b" }).pins.map((pin) => pin.ref)).toEqual(["a", "c"]);

    const withRecord = togglePin(medals, { kind: "record", ref: "rec-level" });
    expect(withRecord).toEqual({ pins: [...medals, { kind: "record", ref: "rec-level" }], notice: null });

    const records = ["rec-streak", "rec-week", "rec-goals"].map((ref) => ({ kind: "record" as const, ref }));
    expect(togglePin(records, { kind: "record", ref: "rec-level" })).toEqual({
      pins: records,
      notice: "Your card shows 3 records. Remove one to add another.",
    });
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
