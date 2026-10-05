import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isTabDataCacheFresh,
  loadTabDataCache,
  markTabDataCacheStaleByPrefix,
  readTabDataCache,
  retainTabDataCacheKeyByPrefix,
  resetTabDataCacheForTests,
  setTabDataCacheScope,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";

describe("tab-data-cache scope isolation", () => {
  afterEach(() => {
    resetTabDataCacheForTests();
    window.sessionStorage.clear();
  });

  it("isolates cached values and purges prior scopes on user switch", () => {
    setTabDataCacheScope("user-a");
    writeTabDataCache("progress-context:test", { value: "A" });
    expect(readTabDataCache<{ value: string }>("progress-context:test")).toEqual({
      value: "A",
    });

    setTabDataCacheScope("user-b");
    expect(
      readTabDataCache<{ value: string }>("progress-context:test")
    ).toBeNull();
    const storageKeysAfterSwitch = Array.from(
      { length: window.sessionStorage.length },
      (_, index) => window.sessionStorage.key(index) ?? ""
    );
    expect(storageKeysAfterSwitch.some((key) => key.includes(":user-a:"))).toBe(false);

    writeTabDataCache("progress-context:test", { value: "B" });
    expect(readTabDataCache<{ value: string }>("progress-context:test")).toEqual({
      value: "B",
    });

    setTabDataCacheScope("user-a");
    expect(readTabDataCache<{ value: string }>("progress-context:test")).toBeNull();
  });
});

describe("tab-data-cache shared warmups", () => {
  afterEach(resetTabDataCacheForTests);

  it("joins a pending warmup and serves the result without another fetch", async () => {
    let resolve!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>(done => { resolve = done; }));
    const background = loadTabDataCache("planner-context:wide", load);
    const foreground = loadTabDataCache("planner-context:wide", load);
    await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(1);
    resolve("ready");
    expect(await foreground).toBe("ready");
    await background;
    expect(await loadTabDataCache("planner-context:wide", load)).toBe("ready");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not cache a warmup invalidated by a mutation", async () => {
    let resolve!: (value: string) => void;
    const old = loadTabDataCache("planner-context:wide", () => new Promise<string>(done => { resolve = done; }));
    await Promise.resolve();
    markTabDataCacheStaleByPrefix("planner-context:");
    await loadTabDataCache("planner-context:wide", async () => "saved");
    resolve("before save");
    await old;
    expect(readTabDataCache("planner-context:wide")).toBe("saved");
  });

  it("does not cache another user's pending response after scope switches", async () => {
    setTabDataCacheScope("alice");
    let resolve!: (value: string) => void;
    const old = loadTabDataCache("settings-data:v1", () => new Promise<string>(done => { resolve = done; }));
    await Promise.resolve();
    setTabDataCacheScope("bob");
    resolve("alice's profile");
    await old;
    expect(readTabDataCache("settings-data:v1")).toBeNull();
  });

  it("releases failed warmups so a foreground request can retry", async () => {
    await expect(loadTabDataCache("profile", async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    expect(await loadTabDataCache("profile", async () => "recovered")).toBe("recovered");
  });
});

describe("tab-data-cache stale-while-revalidate", () => {
  afterEach(() => {
    resetTabDataCacheForTests();
    window.sessionStorage.clear();
  });

  it("keeps last-good values readable after prefix invalidation", () => {
    writeTabDataCache("progress-context:test", { value: "A" });
    expect(isTabDataCacheFresh("progress-context:test")).toBe(true);

    markTabDataCacheStaleByPrefix("progress-context:");

    expect(readTabDataCache<{ value: string }>("progress-context:test")).toEqual({
      value: "A",
    });
    expect(isTabDataCacheFresh("progress-context:test")).toBe(false);
  });
});


describe("rolling Goal View cache retention", () => {
  afterEach(resetTabDataCacheForTests);
  it("removes old windows from memory and session storage without dropping other tabs", () => {
    const prefix = "planner-context:goals:";
    writeTabDataCache(prefix + "old", { days: "old" });
    writeTabDataCache(prefix + "current", { days: "current" });
    writeTabDataCache("planner-context:2026-10", { calendar: true });
    retainTabDataCacheKeyByPrefix(prefix, prefix + "current");
    expect(readTabDataCache(prefix + "old")).toBeNull();
    expect(readTabDataCache(prefix + "current")).toEqual({ days: "current" });
    expect(readTabDataCache("planner-context:2026-10")).toEqual({ calendar: true });
    expect(Object.keys(window.sessionStorage).some(key => key.endsWith(prefix + "old"))).toBe(false);
  });
  it("detaches evicted in-flight pages so late responses cannot refill old windows", async () => {
    const prefix = "planner-context:goals:";
    let resolve!: (value: string) => void;
    const request = loadTabDataCache(prefix + "old", () => new Promise<string>(done => { resolve = done; }));
    await Promise.resolve();
    retainTabDataCacheKeyByPrefix(prefix, prefix + "current");
    resolve("old page");
    await request;
    expect(readTabDataCache(prefix + "old")).toBeNull();
  });
});
