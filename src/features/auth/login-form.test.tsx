import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/login-form";

const signInMock = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const routerMock = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: signInMock,
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: vi.fn(),
  },
}));

describe("LoginForm", () => {
  beforeEach(() => {
    signInMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens the app after sign-in without a welcome toast", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "member@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(routerMock.replace).toHaveBeenCalledWith("/calendar");
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
