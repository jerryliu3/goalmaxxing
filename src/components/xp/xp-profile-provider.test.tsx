import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XpProfileProvider, useXpProfile } from "./xp-profile-provider";
import { XP_REWARD_ARRIVAL_MS } from "./xp-reward-provider";
import { requestXpRefresh } from "@/lib/xp/events";
import { progressionForTotalXp } from "@/lib/xp/progression";

const reward = vi.hoisted(() => ({ celebrate: vi.fn() }));
vi.mock("./xp-reward-provider", async importOriginal => ({
  ...await importOriginal<typeof import("./xp-reward-provider")>(),
  useXpReward: () => reward,
}));
vi.mock("@/components/layout/app-boot-ready", () => ({ useReportAppBootGateReady: () => {} }));

function Harness() {
  const { profile, rewardSequence } = useXpProfile();
  return <div data-xp-reward-target="true">
    <output data-testid="xp">{profile?.totalXp}</output>
    <output data-testid="sequence">{rewardSequence}</output>
  </div>;
}

describe("XP arrival presentation", () => {
  let total = 100;
  beforeEach(() => {
    vi.useFakeTimers();
    total = 100;
    reward.celebrate.mockReset().mockReturnValue(XP_REWARD_ARRIVAL_MS);
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ profile: { totalXp: total, ...progressionForTotalXp(total) }, tracks: [] }),
    })));
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  const mount = async () => {
    await act(async () => { render(<XpProfileProvider><Harness /></XpProfileProvider>); });
  };
  const complete = async () => {
    total = 120;
    await act(async () => requestXpRefresh({
      reason: "completion", desiredFactState: "present", xpDelta: 20,
      sourceRect: { top: 100, left: 100, width: 20, height: 20 },
    }));
  };

  it("holds fill and enlargement through server refresh until the last star arrives", async () => {
    await mount();
    await complete();
    expect(reward.celebrate).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(XP_REWARD_ARRIVAL_MS - 1); });
    expect(screen.getByTestId("xp")).toHaveTextContent("100");
    expect(screen.getByTestId("sequence")).toHaveTextContent("0");
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByTestId("xp")).toHaveTextContent("120");
    expect(screen.getByTestId("sequence")).toHaveTextContent("1");
  });

  it("cancels a pending reward when completion is reversed", async () => {
    await mount();
    await complete();
    total = 100;
    await act(async () => requestXpRefresh({ reason: "completion", desiredFactState: "absent", xpDelta: -20 }));
    act(() => { vi.advanceTimersByTime(XP_REWARD_ARRIVAL_MS); });
    expect(screen.getByTestId("xp")).toHaveTextContent("100");
    expect(screen.getByTestId("sequence")).toHaveTextContent("0");
  });

  it("updates immediately when reduced motion skips the flight", async () => {
    reward.celebrate.mockReturnValue(0);
    await mount();
    await complete();
    expect(screen.getByTestId("xp")).toHaveTextContent("120");
    expect(screen.getByTestId("sequence")).toHaveTextContent("1");
  });
});
