import { describe, expect, it } from "vitest";
import {
  buildProfilePreferencesUpdate,
  plannerPreferencesFromProfile,
} from "@/features/social/profile-preferences";

describe("buildProfilePreferencesUpdate", () => {
  it("returns null when nothing changed", () => {
    expect(
      buildProfilePreferencesUpdate({
        plannerPrimaryTabDirty: false,
        socialActivityVisibleDirty: false,
        plannerPrimaryTab: "checklist",
        socialActivityVisible: true,
      })
    ).toBeNull();
  });

  it("returns only the privacy field when only privacy changed", () => {
    expect(
      buildProfilePreferencesUpdate({
        plannerPrimaryTabDirty: false,
        socialActivityVisibleDirty: true,
        plannerPrimaryTab: "calendar",
        socialActivityVisible: false,
      })
    ).toEqual({
      social_activity_visible: false,
    });
  });

  it("returns both fields when planner tab and privacy changed", () => {
    expect(
      buildProfilePreferencesUpdate({
        plannerPrimaryTabDirty: true,
        socialActivityVisibleDirty: true,
        plannerPrimaryTab: "calendar",
        socialActivityVisible: true,
      })
    ).toEqual({
      planner_primary_tab: "calendar",
      social_activity_visible: true,
    });
  });
});

const fallback = {
  timezone: "America/New_York",
  weekStartsOn: 1,
  restWeekdays: [],
};

describe("plannerPreferencesFromProfile", () => {
  it("uses confirmed profile planner fields instead of fetching planner context", () => {
    expect(
      plannerPreferencesFromProfile(
        {
          timezone: "UTC",
          timezone_confirmed_at: "2026-08-07T00:00:00.000Z",
          week_starts_on: 0,
          rest_weekdays: [6, 0],
        },
        fallback
      )
    ).toEqual({
      timezone: "UTC",
      weekStartsOn: 0,
      restWeekdays: [0, 6],
    });
  });

  it("falls back when timezone confirmation is still pending", () => {
    expect(
      plannerPreferencesFromProfile(
        {
          timezone: "UTC",
          timezone_confirmed_at: null,
          week_starts_on: 0,
          rest_weekdays: [],
        },
        fallback
      )
    ).toEqual(fallback);
  });
});
