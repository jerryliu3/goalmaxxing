import { describe, expect, it } from "vitest";
import {
  COMBINED_CHAPTER_HEIGHT_VH,
  COMBINED_SCENE_STOPS,
  MAYA_XP,
  MONTH_PILL_COUNT,
  YOU_XP_END,
  YOU_XP_START,
  getCaption,
  getCheckedItemCount,
  getClimbBiome,
  getClimbCamera,
  getClimbIndicatorPosition,
  getClimbTrailPoint,
  CLIMB_LAST_PEAK,
  getHeatmapFillCount,
  getInsightsStats,
  getLeaderboardState,
  getLeaderboardTracks,
  getMonthPillCount,
  getPinnedChapterProgress,
  getSceneState,
  shouldCelebrateYou,
} from "@/components/landing/landing-wow-progress";

describe("getCaption", () => {
  it("names the chapter The journey and talks about the future, not scrolling", () => {
    expect(getCaption("month", 0)).toMatch(/future/i);
    expect(getCaption("month")).not.toMatch(/Keep scrolling/i);
    expect(getCaption("checks")).not.toMatch(/Keep scrolling/i);
    expect(getCaption("rank")).toMatch(/someone else|company|together/i);
  });
});

describe("getSceneState", () => {
  it("walks combined scenes without a week card", () => {
    expect(getSceneState(0, COMBINED_SCENE_STOPS).scene).toBe("month");
    expect(getSceneState(0.08, COMBINED_SCENE_STOPS).scene).toBe("month");
    expect(getSceneState(0.25, COMBINED_SCENE_STOPS).scene).toBe("checks");
    expect(getSceneState(0.55, COMBINED_SCENE_STOPS).scene).toBe("insights");
    expect(getSceneState(0.85, COMBINED_SCENE_STOPS).scene).toBe("rank");
  });

  it("plays August plan only once without resetting local progress", () => {
    expect(COMBINED_SCENE_STOPS.map((stop) => stop.scene)).toEqual([
      "month",
      "checks",
      "insights",
      "rank",
    ]);

    const early = getSceneState(0.04, COMBINED_SCENE_STOPS);
    const later = getSceneState(0.1, COMBINED_SCENE_STOPS);
    expect(early.scene).toBe("month");
    expect(later.scene).toBe("month");
    expect(later.local).toBeGreaterThan(early.local);
  });

  it("reports local progress within the current scene", () => {
    const monthStart = COMBINED_SCENE_STOPS[0]?.at ?? 0;
    const checksStart = COMBINED_SCENE_STOPS[1]?.at ?? 1;
    const midway = monthStart + (checksStart - monthStart) / 2;
    const state = getSceneState(midway, COMBINED_SCENE_STOPS);

    expect(state.scene).toBe("month");
    expect(state.local).toBeCloseTo(0.5, 5);
  });

  it("clamps out-of-range progress", () => {
    expect(getSceneState(-1, COMBINED_SCENE_STOPS).scene).toBe("month");
    expect(getSceneState(2, COMBINED_SCENE_STOPS).scene).toBe("rank");
    expect(getSceneState(2, COMBINED_SCENE_STOPS).local).toBe(1);
  });
});

describe("scroll-driven product beats", () => {
  it("reveals August plan goals during the month scene", () => {
    expect(getMonthPillCount("month", 0, MONTH_PILL_COUNT)).toBe(0);
    expect(getMonthPillCount("month", 0.5, MONTH_PILL_COUNT)).toBe(3);
    expect(getMonthPillCount("checks", 0, MONTH_PILL_COUNT)).toBe(
      MONTH_PILL_COUNT
    );
  });

  it("fills the insights heatmap and counts stats up during the insights scene", () => {
    expect(getHeatmapFillCount("checks", 1, 140)).toBe(0);
    expect(getHeatmapFillCount("insights", 0, 140)).toBe(0);
    expect(getHeatmapFillCount("insights", 0.5, 140)).toBe(70);
    expect(getHeatmapFillCount("rank", 0, 140)).toBe(140);
    expect(getInsightsStats("month", 1).totalActivities).toBe(18);
    expect(getInsightsStats("insights", 0).totalActivities).toBe(18);
    expect(getInsightsStats("insights", 1).totalActivities).toBe(142);
    expect(getInsightsStats("rank", 0).activeStreakWeeks).toBe(12);
  });

  it("checks items off across the checklist scene", () => {
    expect(getCheckedItemCount("month", 1, 5)).toBe(0);
    expect(getCheckedItemCount("checks", 0, 5)).toBe(0);
    expect(getCheckedItemCount("checks", 0.39, 5)).toBe(1);
    expect(getCheckedItemCount("checks", 1, 5)).toBe(5);
    expect(getCheckedItemCount("insights", 0, 5)).toBe(5);
  });

  it("promotes You from rank 2 to 1 as XP passes Maya", () => {
    const start = getLeaderboardState(0);
    const end = getLeaderboardState(1);

    expect(start.youRank).toBe(2);
    expect(start.youXp).toBe(YOU_XP_START);
    expect(start.mayaXp).toBe(MAYA_XP);
    expect(end.youXp).toBe(YOU_XP_END);
    expect(end.youRank).toBe(1);
    expect(end.youXp).toBeGreaterThan(MAYA_XP);
  });

  it("slides You through Maya with a mid-pass lift instead of a rank jump", () => {
    const start = getLeaderboardTracks(0);
    const passing = getLeaderboardTracks(0.78);
    const end = getLeaderboardTracks(1);

    expect(start.youTrack).toBeCloseTo(1, 5);
    expect(start.mayaTrack).toBeCloseTo(0, 5);
    expect(start.youLift).toBeCloseTo(0, 5);
    expect(passing.youLift).toBeGreaterThan(0.5);
    expect(end.youTrack).toBeCloseTo(0, 5);
    expect(end.mayaTrack).toBeCloseTo(1, 5);
    expect(end.youLift).toBeCloseTo(0, 5);
  });

  it("holds confetti until You has finished moving into first", () => {
    expect(shouldCelebrateYou(0)).toBe(false);
    expect(shouldCelebrateYou(0.78)).toBe(false);
    expect(shouldCelebrateYou(0.94)).toBe(false);
    expect(shouldCelebrateYou(1)).toBe(true);
  });
});

describe("shared climb", () => {
  it("pans the camera from the lower slope toward the summit", () => {
    const start = getClimbCamera(0);
    const end = getClimbCamera(1);

    expect(end.focalY).toBeLessThan(start.focalY);
    expect(end.scale).toBeLessThan(start.scale);
    expect(getClimbBiome(0)).toBe("basecamp");
    expect(getClimbBiome(1)).toBe("summit");
  });

  it("follows an S-shaped climb that finishes on the last mountain peak", () => {
    const start = getClimbIndicatorPosition(0);
    const mid = getClimbIndicatorPosition(0.45);
    const end = getClimbIndicatorPosition(1);

    expect(end.y).toBeLessThan(mid.y);
    expect(mid.y).toBeLessThan(start.y);
    expect(end.x).toBeGreaterThan(start.x);
    expect(end.x).toBeCloseTo((CLIMB_LAST_PEAK.x / 1440) * 100, 0);
    expect(end.y).toBeCloseTo((CLIMB_LAST_PEAK.y / 900) * 100, 0);
  });

  it("keeps the mid-climb terrace from dropping too far", () => {
    const firstRise = getClimbTrailPoint(0.26);
    const valley = Math.max(
      ...[0.38, 0.44, 0.5, 0.56].map((t) => getClimbTrailPoint(t).y)
    );
    expect(valley - firstRise.y).toBeLessThan(90);
    expect(valley).toBeLessThan(510);
  });

  it("shortens the chapter after dropping the second August plan beat", () => {
    expect(COMBINED_CHAPTER_HEIGHT_VH).toBe(820);
  });

  it("maps a pinned section's position into 0-1 progress", () => {
    expect(getPinnedChapterProgress(120, 9720, 900)).toBe(0);
    expect(getPinnedChapterProgress(0, 9720, 900)).toBe(0);
    expect(getPinnedChapterProgress(-0.2 * (9720 - 900), 9720, 900)).toBeCloseTo(
      0.2,
      5
    );
    expect(getPinnedChapterProgress(-(9720 - 900), 9720, 900)).toBe(1);
    expect(getPinnedChapterProgress(-20000, 9720, 900)).toBe(1);
  });
});
