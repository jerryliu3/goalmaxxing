import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, useState } from "react";
vi.mock("./setup-profile-card", () => ({
  SetupProfileCard: ({ isPrivate }: { isPrivate: boolean }) => createElement("div", { "data-testid": "guide-card", "data-private": String(isPrivate) }),
}));
afterEach(cleanup);
const mocks = vi.hoisted(() => ({ getJson: vi.fn(), putJson: vi.fn(), update: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ getJson: mocks.getJson, putJson: mocks.putJson, getApiErrorMessage: (_cause: unknown, fallback: string) => fallback }));
vi.mock("@/lib/cache/planner-tab-cache", () => ({ invalidatePlannerRelatedTabCaches: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }), update: mocks.update }) }) }));
import { JourneyIntroPreferencesStep, createDefaultJourneyIntroPreferences, loadJourneyIntroPreferences, saveJourneyIntroPreferences } from "./journey-intro-preferences-step";
beforeEach(() => {
  vi.clearAllMocks(); mocks.putJson.mockResolvedValue({}); mocks.eq.mockResolvedValue({ error: null }); mocks.update.mockReturnValue({ eq: mocks.eq });
});
describe("setup preferences", () => {
  it("updates the guide card when switching Private and Public", async () => {
    function Guide() {
      const [value, onChange] = useState(createDefaultJourneyIntroPreferences);
      return createElement(JourneyIntroPreferencesStep, { userId: "owner", value, onChange, saveProfileRef: { current: async () => undefined }, onProfileStatusChange: () => undefined });
    }
    const user = userEvent.setup();
    render(createElement(Guide));
    expect(screen.getByTestId("guide-card")).toHaveAttribute("data-private", "false");
    await user.click(screen.getByRole("button", { name: "Private" }));
    expect(screen.getByTestId("guide-card")).toHaveAttribute("data-private", "true");
    await user.click(screen.getByRole("button", { name: "Public" }));
    expect(screen.getByTestId("guide-card")).toHaveAttribute("data-private", "false");
  });

  it("preserves existing blackout ranges and changes preferences without finishing setup", async () => {
    const value = createDefaultJourneyIntroPreferences();
    value.defaultPolicy.blackoutRanges = [{ start: "2026-12-20", end: "2026-12-25" }];
    value.weekStartsOn = 0; value.socialActivityVisible = false;
    await saveJourneyIntroPreferences("owner", value);
    expect(mocks.putJson).toHaveBeenCalledWith("/api/planner/context", expect.objectContaining({ defaultPolicy: expect.objectContaining({ blackoutRanges: value.defaultPolicy.blackoutRanges, weekStartsOn: 0 }) }));
    expect(mocks.update).toHaveBeenCalledWith({ social_activity_visible: false });
    expect(mocks.eq).toHaveBeenCalledWith("id", "owner");
  });
  it("surfaces a load failure instead of replacing saved settings with defaults", async () => {
    mocks.getJson.mockRejectedValue(new Error("Offline"));
    mocks.maybeSingle.mockResolvedValue({ data: { social_activity_visible: false }, error: null });
    await expect(loadJourneyIntroPreferences("owner")).rejects.toThrow("Offline");
    expect(mocks.putJson).not.toHaveBeenCalled();
  });
});
