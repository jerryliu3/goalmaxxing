import { describe, expect, it } from "vitest";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";

describe("resolvePublicProfileLabel", () => {
  it("prefers display name, then username", () => {
    expect(
      resolvePublicProfileLabel({
        subjectUserId: "user-1",
        displayName: "Alex Chen",
        username: "alex",
        avatarUrl: null,
        isPrivate: false,
      })
    ).toBe("Alex Chen");

    expect(
      resolvePublicProfileLabel({
        subjectUserId: "user-1",
        displayName: null,
        username: "alex",
        avatarUrl: null,
        isPrivate: false,
      })
    ).toBe("@alex");
  });
});
