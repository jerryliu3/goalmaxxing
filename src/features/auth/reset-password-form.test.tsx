import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(), getSession: vi.fn(), setSession: vi.fn(), resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(), replace: vi.fn(), refresh: vi.fn(), reportError: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: {
  initialize: mocks.initialize, getSession: mocks.getSession, setSession: mocks.setSession,
  resetPasswordForEmail: mocks.resetPasswordForEmail, updateUser: mocks.updateUser,
} }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }) }));
vi.mock("@/lib/env", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://goalmaxxing.com" }) }));
vi.mock("@/lib/observability/report-error", () => ({ reportError: mocks.reportError }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/reset-password");
  mocks.initialize.mockImplementation(async () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState(null, "", url);
    return { error: null };
  });
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
  mocks.setSession.mockResolvedValue({ error: null });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
});
afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });

describe("ResetPasswordForm", () => {
  it("requests a reset email on a direct visit even if already signed in", async () => {
    render(<ResetPasswordForm />);
    fireEvent.change(await screen.findByLabelText("Account email"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await waitFor(() => expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://goalmaxxing.com/reset-password",
    }));
    expect((await screen.findByRole("status")).textContent).toContain("Open the link in this browser");
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("waits for the PKCE exchange, then sets a new password without requesting another email", async () => {
    window.history.replaceState(null, "", "/reset-password?code=one-use-code");
    let resolveInitialization!: (value: { error: null }) => void;
    mocks.initialize.mockImplementation(() => new Promise((resolve) => { resolveInitialization = resolve; }));
    render(<ResetPasswordForm />);
    expect(screen.getByRole("status").textContent).toContain("Checking reset link");
    expect(screen.queryByLabelText("New password")).toBeNull();
    window.history.replaceState(null, "", "/reset-password");
    resolveInitialization({ error: null });
    fireEvent.change(await screen.findByLabelText("New password"), { target: { value: "replacement-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "replacement-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Set new password" }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: "replacement-password" }));
    expect((await screen.findByRole("status")).textContent).toContain("Your password has been updated");
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Continue to plan" }));
    expect(mocks.replace).toHaveBeenCalledWith("/calendar");
  });

  it("preserves recovery intent during Strict Mode effect replay and refresh", async () => {
    window.history.replaceState(null, "", "/reset-password?code=one-use-code");
    const view = render(<StrictMode><ResetPasswordForm /></StrictMode>);
    await screen.findByLabelText("New password");
    expect(window.location.search).toBe("?flow=recovery");
    view.unmount();
    render(<ResetPasswordForm />);
    await screen.findByLabelText("New password");
  });

  it("accepts the implicit recovery session sent by the mobile app", async () => {
    window.history.replaceState(null, "", "/reset-password#type=recovery&access_token=access&refresh_token=refresh");
    mocks.initialize.mockResolvedValue({ error: { message: "Not a valid PKCE flow url" } });
    render(<ResetPasswordForm />);
    await screen.findByLabelText("New password");
    expect(mocks.setSession).toHaveBeenCalledWith({ access_token: "access", refresh_token: "refresh" });
    expect(window.location.hash).toBe("");
  });

  it("shows an actionable resend flow when a code fails, even with an existing session", async () => {
    window.history.replaceState(null, "", "/reset-password?code=expired");
    mocks.initialize.mockResolvedValue({ error: { message: "expired" } });
    render(<ResetPasswordForm />);
    expect((await screen.findByRole("alert")).textContent).toContain("Request a new link");
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByLabelText("Account email")).toBeTruthy();
  });

  it("rejects a code that was never exchanged because this browser has no verifier", async () => {
    window.history.replaceState(null, "", "/reset-password?code=unconsumed");
    mocks.initialize.mockResolvedValue({ error: null });
    render(<ResetPasswordForm />);
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("does not show the update form when the recovery session is missing", async () => {
    window.history.replaceState(null, "", "/reset-password?flow=recovery");
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    render(<ResetPasswordForm />);
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("handles expired email redirects rather than quietly showing the request screen", async () => {
    window.history.replaceState(null, "", "/reset-password#error=access_denied&error_code=otp_expired");
    render(<ResetPasswordForm />);
    expect((await screen.findByRole("alert")).textContent).toContain("expired");
  });

  it("re-enables sending after a network failure", async () => {
    mocks.resetPasswordForEmail.mockRejectedValue(new Error("offline"));
    render(<ResetPasswordForm />);
    fireEvent.change(await screen.findByLabelText("Account email"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Please try again");
    expect((screen.getByRole("button", { name: "Send reset link" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
