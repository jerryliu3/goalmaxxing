import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readSettingsTabCache, fetchSettingsTabData } from "./settings-tab-data";
import { resetTabDataCacheForTests } from "@/lib/cache/tab-data-cache";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser }, from: mocks.from }),
}));

describe("Profile data preload", () => {
  let displayName = "Alice";
  beforeEach(() => {
    resetTabDataCacheForTests();
    displayName = "Alice";
    mocks.getUser.mockReset().mockResolvedValue({
      data: { user: { id: "user-1", email: "alice@example.com" } }, error: null,
    });
    mocks.from.mockReset().mockImplementation((table: string) => {
      const profile = { id: "user-1", username: "alice", display_name: displayName, timezone: "UTC" };
      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        maybeSingle: () => Promise.resolve({ data: profile, error: null }),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({ data: table === "profiles" ? [profile] : [], error: null }).then(resolve),
      };
      return query;
    });
  });
  afterEach(() => resetTabDataCacheForTests());

  it("shares a pending warmup with opening Profile and reuses the result", async () => {
    let authenticate!: (value: unknown) => void;
    mocks.getUser.mockReturnValueOnce(new Promise(resolve => { authenticate = resolve; }));
    const warming = fetchSettingsTabData();
    const foreground = fetchSettingsTabData();
    expect(foreground).toBe(warming);
    await Promise.resolve();
    authenticate({ data: { user: { id: "user-1", email: "alice@example.com" } }, error: null });
    const data = await foreground;
    expect(data?.profileDraft.display_name).toBe("Alice");
    expect(readSettingsTabCache()).toBe(data);
    await fetchSettingsTabData();
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
  });

  it("reloads saved profile details even when the preload is still fresh", async () => {
    await fetchSettingsTabData();
    displayName = "Updated Alice";
    const updated = await fetchSettingsTabData({ forceRefresh: true });
    expect(updated?.profileDraft.display_name).toBe("Updated Alice");
    expect(readSettingsTabCache()?.profileDraft.display_name).toBe("Updated Alice");
    expect(mocks.getUser).toHaveBeenCalledTimes(2);
  });

  it("does not cache an authentication failure as empty settings", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "offline" } });
    await expect(fetchSettingsTabData()).rejects.toThrow("Profile authentication");
    expect(readSettingsTabCache()).toBeNull();
    expect((await fetchSettingsTabData())?.state.userId).toBe("user-1");
  });
});
