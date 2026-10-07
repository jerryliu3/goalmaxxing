import { describe, expect, it } from "vitest";
import {
  buildProfilePreferencesUpdate,
  plannerPreferencesFromProfile,
  plannerPreferencesNeedSave,
} from "@/features/social/profile-preferences";

describe("buildProfilePreferencesUpdate", () => {
  it("returns null when nothing changed", () => {
    expect(
      buildProfilePreferencesUpdate({
        socialActivityVisibleDirty: false,
        socialActivityVisible: true,
      })
    ).toBeNull();
  });

  it("returns only the privacy field when only privacy changed", () => {
    expect(
      buildProfilePreferencesUpdate({
        socialActivityVisibleDirty: true,
        socialActivityVisible: false,
      })
    ).toEqual({
      social_activity_visible: false,
    });
  });

  it("returns the privacy field when it changes", () => {
    expect(
      buildProfilePreferencesUpdate({
        socialActivityVisibleDirty: true,
        socialActivityVisible: true,
      })
    ).toEqual({
      social_activity_visible: true,
    });
  });
});

const fallback = {
  timezone: "America/New_York",
  weekStartsOn: 1,
  restWeekdays: [],
  timezoneConfirmed: false,
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
      timezoneConfirmed: true,
    });
  });

  it("keeps the displayed fallback when timezone confirmation is still pending", () => {
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

describe("plannerPreferencesNeedSave", () => {
  it("stays saveable when the shown timezone has not been confirmed", () => {
    expect(
      plannerPreferencesNeedSave({
        draft: { timezone: "America/New_York", weekStartsOn: 1 },
        persisted: { timezone: "America/New_York", weekStartsOn: 1, timezoneConfirmed: false },
      })
    ).toBe(true);
  });

  it("stays clean once the shown timezone and week start are confirmed", () => {
    expect(
      plannerPreferencesNeedSave({
        draft: { timezone: "America/New_York", weekStartsOn: 1 },
        persisted: { timezone: "America/New_York", weekStartsOn: 1, timezoneConfirmed: true },
      })
    ).toBe(false);
  });
});
