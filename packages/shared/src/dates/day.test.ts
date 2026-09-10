import { describe, expect, it } from "vitest";
import { resolveSelectedDateState } from "./day";

describe("resolveSelectedDateState", () => {
  it("classifies dates relative to today", () => {
    expect(resolveSelectedDateState("2026-09-05", "2026-09-06")).toBe("past");
    expect(resolveSelectedDateState("2026-09-06", "2026-09-06")).toBe("today");
    expect(resolveSelectedDateState("2026-09-07", "2026-09-06")).toBe("future");
  });
});
