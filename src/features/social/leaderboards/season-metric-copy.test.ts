import { describe, expect, it } from "vitest";
import { describeSeasonMetric } from "@/features/social/leaderboards/season-metric-copy";

describe("describeSeasonMetric", () => {
  it("describes each supported season metric", () => {
    expect(describeSeasonMetric("total_xp")).toBe(
      "Ranked by total XP earned this season."
    );
    expect(describeSeasonMetric("category_xp", "Health")).toBe(
      "Ranked by Health XP earned this season."
    );
    expect(describeSeasonMetric("completions_count")).toBe(
      "Ranked by completed sessions this season."
    );
    expect(describeSeasonMetric("distinct_active_days")).toBe(
      "Ranked by distinct active days this season."
    );
    expect(describeSeasonMetric("max_streak_days")).toBe(
      "Ranked by the longest streak this season."
    );
  });
});
