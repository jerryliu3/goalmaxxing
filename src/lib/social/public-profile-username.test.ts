import { describe, expect, it } from "vitest";
import {
  buildPublicProfilePath,
  buildPublicProfileUrl,
  isValidPublicProfileUsername,
  normalizePublicProfileUsername,
} from "@/lib/social/public-profile-username";

describe("public profile username helpers", () => {
  it("normalizes usernames to lowercase", () => {
    expect(normalizePublicProfileUsername("  Alex_12  ")).toBe("alex_12");
  });

  it("validates username pattern", () => {
    expect(isValidPublicProfileUsername("alex")).toBe(true);
    expect(isValidPublicProfileUsername("ab")).toBe(false);
    expect(isValidPublicProfileUsername("Alex!")).toBe(false);
  });

  it("builds profile paths and urls", () => {
    expect(buildPublicProfilePath("Alex")).toBe("/user/alex");
    expect(buildPublicProfileUrl("alex", "https://goalmaxxing.xyz")).toBe(
      "https://goalmaxxing.xyz/user/alex"
    );
  });
});
