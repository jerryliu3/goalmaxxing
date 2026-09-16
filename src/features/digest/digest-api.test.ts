import { describe, expect, it } from "vitest";
import { digestActionHref } from "@/features/digest/digest-api";

describe("digestActionHref", () => {
  it("routes suggestion actions to existing app surfaces", () => {
    expect(digestActionHref("plan")).toBe("/calendar?surface=calendar");
    expect(digestActionHref("today")).toBe("/calendar?surface=checklist");
    expect(digestActionHref("progress")).toBe("/insights");
    expect(digestActionHref(null)).toBeNull();
  });

  it("prefixes demo paths", () => {
    expect(digestActionHref("plan", "/demo")).toBe("/demo/calendar?surface=calendar");
  });
});
