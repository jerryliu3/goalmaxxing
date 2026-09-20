import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMembershipCard } from "@/features/social/profile-membership-card";
import type { PublicProfileIdentity, PublicProfileOverallStats } from "@cadence/shared/social/public-profile";

vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
vi.mock("@/lib/ui/use-media-query", () => ({ useMediaQuery: () => true }));

beforeEach(() => {
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number; pointerType: string; isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse";
      this.isPrimary = init.isPrimary ?? true;
    }
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const profile: PublicProfileIdentity = {
  subjectUserId: "subject-1",
  username: "alice",
  displayName: "Alice Park",
  avatarUrl: "https://example.com/alice.jpg",
  isPrivate: false,
  createdAt: "2026-01-02T00:00:00.000Z",
  memberNumber: 4,
};

const stats: PublicProfileOverallStats = {
  totalActivities: 20,
  totalGoalsCompleted: 4,
  todayActivities: 1,
  activeStreakDays: 3,
  currentWeekActivities: { current: 7, previous: 5, delta: 2, deltaPercent: 40 },
  currentMonthActivities: { current: 15, previous: 12, delta: 3, deltaPercent: 25 },
};

describe("public membership card rotation", () => {
  it("captures a drag that starts on covering card content", () => {
    render(
      <ProfileMembershipCard profile={profile} overallStats={stats} currentLevel={7} />
    );

    const object = screen.getByRole("group", { name: "Alice Park membership card rotation" });
    const article = screen.getByRole("article", { name: "Alice Park membership card" });
    const capture = vi.spyOn(object, "setPointerCapture");
    fireEvent.pointerDown(article, {
      pointerId: 8,
      button: 0,
      clientX: 180,
      clientY: 160,
      isPrimary: true,
    });
    expect(capture).toHaveBeenCalledWith(8);
  });

  it("keeps turning after pointer capture is lost", () => {
    render(
      <ProfileMembershipCard profile={profile} overallStats={stats} currentLevel={7} />
    );

    const object = screen.getByRole("group", { name: "Alice Park membership card rotation" });
    const stage = object.closest<HTMLElement>("[data-material]")!;
    vi.spyOn(object, "setPointerCapture").mockImplementation(() => {
      throw new DOMException("Unable to capture", "InvalidStateError");
    });
    fireEvent.pointerDown(object, {
      pointerId: 9,
      button: 0,
      clientX: 180,
      clientY: 160,
      isPrimary: true,
    });
    fireEvent.lostPointerCapture(object, { pointerId: 9 });
    fireEvent.pointerMove(window, { pointerId: 9, clientX: 430, clientY: 80 });

    expect(stage).toHaveAttribute("data-dragging", "true");
    expect(parseFloat(stage.style.getPropertyValue("--ry"))).toBeGreaterThan(100);
  });
});
