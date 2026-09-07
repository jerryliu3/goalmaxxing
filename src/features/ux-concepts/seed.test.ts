import { describe, expect, it } from "vitest";
import {
  CONCEPT_TODAY,
  CONCEPT_TODAY_WEEKDAY,
  STRENGTH_MISSED_DATE,
  applicableItems,
  conceptItems,
  itemsOnDate,
  partnerItems,
  todayOpenCount,
} from "@/features/ux-concepts/seed";

describe("ux concept seed", () => {
  it("uses a Thursday story with tempo, launch notes, weekly reset, and missed Strength", () => {
    expect(CONCEPT_TODAY_WEEKDAY).toBe("Thursday");
    const titles = conceptItems.map((item) => item.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Tempo run",
        "Launch notes",
        "Weekly reset",
        "Deep work",
        "Strength",
      ])
    );
    expect(conceptItems.find((item) => item.title === "Launch notes")?.kind).toBe(
      "task"
    );
    expect(conceptItems.find((item) => item.title === "Tempo run")?.kind).toBe(
      "goal"
    );
    expect(conceptItems.find((item) => item.id === "strength")?.date).toBe(
      STRENGTH_MISSED_DATE
    );
  });

  it("keeps Strength off Thursday until recovered", () => {
    const before = itemsOnDate(CONCEPT_TODAY, null).map((item) => item.id);
    expect(before).not.toContain("strength");
    const after = itemsOnDate(CONCEPT_TODAY, CONCEPT_TODAY).map((item) => item.id);
    expect(after).toContain("strength");
  });

  it("counts three open items on Thursday before any interaction", () => {
    expect(todayOpenCount(new Set(["deep-work"]), null)).toBe(3);
  });

  it("keeps flexible applicable work off the calendar and on the checklist", () => {
    expect(itemsOnDate(CONCEPT_TODAY, null).map((item) => item.id)).not.toContain(
      "review-offer"
    );
    const applicable = applicableItems(CONCEPT_TODAY, null).map((item) => item.id);
    expect(applicable).toEqual(
      expect.arrayContaining(["tempo-run", "review-offer", "strength"])
    );
    expect(conceptItems.find((item) => item.id === "review-offer")?.kind).toBe(
      "task"
    );
  });

  it("keeps Duo as Maya completing Yoga, not a feed of events", () => {
    expect(partnerItems).toHaveLength(2);
    expect(partnerItems[0]).toMatchObject({
      title: "Yoga",
      completed: true,
      date: CONCEPT_TODAY,
    });
  });
});
