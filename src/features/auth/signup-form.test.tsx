import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "@/features/auth/signup-form";
import {
  JOURNEY_INTRO_FORCE_USER_ID_KEY,
  JOURNEY_INTRO_SEEN_KEY,
  JOURNEY_ONBOARDING_COMPLETED_KEY,
} from "@/components/intro/journey-intro-overlay";
import { STARTER_PACKS_SEEN_PREFIX } from "@/features/goals/starter-packs";

const signUpMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const routerMock = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: rpcMock,
    auth: {
      signUp: signUpMock,
    },
  }),
}));

vi.mock("@/lib/dates/timezone", () => ({
  resolveUserTimezone: () => "America/Los_Angeles",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SignupForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
    rpcMock.mockResolvedValue({ data: true, error: null });
    signUpMock.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "token" } },
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("sends the device timezone and opens calendar after signup", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("Email"), "newuser@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "newuser@example.com",
        options: expect.objectContaining({
          data: expect.objectContaining({
            username: "newuser",
            seed_default_goals: true,
            timezone: "America/Los_Angeles",
          }),
        }),
      })
    );
    expect(routerMock.replace).toHaveBeenCalledWith("/calendar");
    expect(routerMock.replace).not.toHaveBeenCalledWith("/");
    expect(window.localStorage.getItem(JOURNEY_INTRO_FORCE_USER_ID_KEY)).toBe(
      "user-1"
    );
  });

  it("clears a previous user's onboarding storage even without a user id", async () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, "2026-08-01");
    window.localStorage.setItem(`${STARTER_PACKS_SEEN_PREFIX}old-user`, "done");
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("Email"), "newuser@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY)).toBeNull();
    expect(window.localStorage.getItem(JOURNEY_INTRO_SEEN_KEY)).toBeNull();
    expect(
      window.localStorage.getItem(`${STARTER_PACKS_SEEN_PREFIX}old-user`)
    ).toBeNull();
    expect(window.localStorage.getItem(JOURNEY_INTRO_FORCE_USER_ID_KEY)).toBeNull();
    expect(routerMock.replace).toHaveBeenCalledWith("/login");
  });
});
