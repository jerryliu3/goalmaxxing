import { describe, expect, it } from "vitest";
import { landingCalendarShortLabel } from "./landing-calendar-label";

describe("marketing calendar short labels", () => {
  it.each([
    ["Tempo run", "🏃 Run"],
    ["Strength", "🏋️ Lift"],
    ["Read 10 pages", "📖 Read"],
    ["Read 20 pages", "📖 Read"],
    ["Deep work", "🎯 Focus"],
    ["Budget review", "💰 Budget"],
    ["Plan review", "🗓️ Plan"],
    ["Goal review", "📝 Review"],
    ["Weekly review", "📝 Review"],
    ["Weekly reset", "🔄 Reset"],
    ["Launch notes", "🗒️ Notes"],
    ["Launch copy", "✍️ Copy"],
    ["Team sync", "🤝 Sync"],
    ["Roadmap", "🗓️ Plan"],
    ["Mobility", "🤸 Move"],
    ["Meal prep", "🥗 Meals"],
    ["Evening walk", "🚶 Walk"],
    ["Long ride", "🚴 Ride"],
    ["Bike commute", "🚲 Bike"],
  ])("keeps %s readable in narrow calendar cells", (label, shortLabel) => {
    expect(landingCalendarShortLabel(label)).toBe(shortLabel);
  });

  it("pairs already short labels with emojis and gives unknown labels one word", () => {
    expect(landingCalendarShortLabel("Yoga")).toBe("🧘 Yoga");
    expect(landingCalendarShortLabel("Focus")).toBe("🎯 Focus");
    expect(landingCalendarShortLabel("Update")).toBe("📝 Update");
    expect(landingCalendarShortLabel("A custom goal")).toBe("📌 Goal");
  });
});
