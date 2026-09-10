import { describe, expect, it } from "vitest";
import {
  isAppBootGatedPath,
  isAppBootPath,
  normalizeAppBootPath,
} from "@/components/layout/app-boot-preload";

describe("app boot path helpers", () => {
  it("treats demo prefixes as the underlying app path", () => {
    expect(normalizeAppBootPath("/demo/calendar")).toBe("/calendar");
    expect(normalizeAppBootPath("/demo")).toBe("/");
  });

  it("covers authenticated app routes for the preload overlay", () => {
    expect(isAppBootPath("/calendar")).toBe(true);
    expect(isAppBootPath("/demo/insights/more")).toBe(true);
    expect(isAppBootPath("/app")).toBe(true);
    expect(isAppBootPath("/")).toBe(false);
    expect(isAppBootPath("/login")).toBe(false);
  });

  it("gates splash dismissal to surfaces that report their own ready state", () => {
    expect(isAppBootGatedPath("/calendar")).toBe(true);
    expect(isAppBootGatedPath("/demo/settings")).toBe(true);
    expect(isAppBootGatedPath("/social")).toBe(false);
    expect(isAppBootGatedPath("/goals/new")).toBe(false);
  });
});
