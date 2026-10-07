import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordUpdateForm } from "@/features/auth/password-update-form";

const mocks = vi.hoisted(() => ({ updateUser: vi.fn(), success: vi.fn(), reportError: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { updateUser: mocks.updateUser } }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));
vi.mock("@/lib/observability/report-error", () => ({ reportError: mocks.reportError }));

function fillPasswords(confirmation = "new-password") {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password" } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirmation } });
}

beforeEach(() => { vi.clearAllMocks(); mocks.updateUser.mockResolvedValue({ error: null }); });
afterEach(cleanup);

describe("PasswordUpdateForm", () => {
  it("changes the password with the current password through Supabase and clears secrets", async () => {
    render(<PasswordUpdateForm requireCurrentPassword />);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old-password" } });
    fillPasswords();
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Password updated."));
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "new-password", current_password: "old-password" });
    expect((screen.getByLabelText("Current password") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("New password") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Confirm new password") as HTMLInputElement).value).toBe("");
  });

  it("does not require the forgotten password for recovery", async () => {
    const onSuccess = vi.fn();
    render(<PasswordUpdateForm onSuccess={onSuccess} />);
    expect(screen.queryByLabelText("Current password")).toBeNull();
    fillPasswords();
    fireEvent.click(screen.getByRole("button", { name: "Set new password" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "new-password" });
  });

  it("rejects mismatched confirmation before any write", () => {
    render(<PasswordUpdateForm />);
    fillPasswords("different-password");
    fireEvent.click(screen.getByRole("button", { name: "Set new password" }));
    expect(screen.getByRole("alert").textContent).toContain("do not match");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("keeps the form available when Supabase rejects the current password", async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: "Current password is incorrect", status: 422 } });
    const onSuccess = vi.fn();
    render(<PasswordUpdateForm requireCurrentPassword onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "wrong-password" } });
    fillPasswords();
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Current password is incorrect"));
    expect(onSuccess).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Change password" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("recovers from a network failure without reporting passwords", async () => {
    mocks.updateUser.mockRejectedValue(new Error("offline"));
    render(<PasswordUpdateForm />);
    fillPasswords();
    fireEvent.click(screen.getByRole("button", { name: "Set new password" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Please try again"));
    expect(mocks.reportError).toHaveBeenCalledWith(expect.any(Error), { surface: "password-update" });
  });
});
