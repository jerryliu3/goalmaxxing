import { describe, expect, it } from "vitest";
import { buildProgressSections } from "@/features/insights/progress-overview/build-progress-sections";

describe("buildProgressSections", () => {
  it("frames the progress tracker as a working panel", () => {
    const sections = buildProgressSections({
      weekRhythm: { rows: [], loading: false, error: null },
      history: <p>Tracker</p>,
    });

    expect(sections.find((section) => section.id === "history")?.framed).toBe(true);
  });
});
