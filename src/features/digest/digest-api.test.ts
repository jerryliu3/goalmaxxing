import { describe, expect, it } from "vitest";
import { digestActionHref, recoveryReviewHref } from "@/features/digest/digest-api";

describe("digestActionHref", () => {
  it("routes suggestion actions to existing app surfaces", () => {
    expect(digestActionHref("plan")).toBe("/calendar?surface=calendar");
    expect(digestActionHref("today")).toBe("/calendar?surface=checklist");
    expect(digestActionHref("progress")).toBe("/insights");
    expect(digestActionHref("goals")).toBe("/goals/new");
    expect(digestActionHref(null)).toBeNull();
  });

  it("prefixes demo paths", () => {
    expect(digestActionHref("plan", "/demo")).toBe("/demo/calendar?surface=calendar");
    expect(digestActionHref("goals", "/demo")).toBe("/demo/goals/new");
  });
});

describe("recoveryReviewHref", () => {
  it("opens Agenda straight into the recovery review", () => {
    expect(recoveryReviewHref()).toBe("/calendar?surface=calendar&review=recovery");
    expect(recoveryReviewHref("/demo/")).toBe("/demo/calendar?surface=calendar&review=recovery");
  });
});
