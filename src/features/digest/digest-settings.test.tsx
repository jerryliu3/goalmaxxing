import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DigestSettings } from "@/features/digest/digest-settings";
import { requestDigestOpen } from "@/features/digest/digest-api";

const mocks = vi.hoisted(() => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
  postJson: mocks.postJson,
  getApiErrorMessage: () => "error",
  isApiClientError: () => false,
}));

vi.mock("@/features/digest/digest-api", async () => {
  const actual = await vi.importActual<typeof import("@/features/digest/digest-api")>(
    "@/features/digest/digest-api"
  );
  return {
    ...actual,
    requestDigestOpen: vi.fn(),
  };
});

describe("DigestSettings", () => {
  beforeEach(() => {
    mocks.getJson.mockResolvedValue({
      digestAutoShow: true,
    });
    mocks.postJson.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("saves auto-show and can replay", async () => {
    const user = userEvent.setup();
    render(<DigestSettings />);
    const autoShow = await screen.findByRole("switch", {
      name: "Show my check-in when I first open the app",
    });
    await waitFor(() => expect(autoShow).toBeEnabled());
    expect(autoShow).toHaveAttribute("aria-checked", "true");
    await user.click(autoShow);
    await waitFor(() =>
      expect(mocks.postJson).toHaveBeenCalledWith("/api/digest/settings", {
        digestAutoShow: false,
      })
    );
    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect(requestDigestOpen).toHaveBeenCalled();
  });

  it("relies on the settings panel for its title", async () => {
    render(<DigestSettings />);
    await screen.findByRole("switch");
    expect(screen.queryByText("Check-in", { exact: true })).not.toBeInTheDocument();
  });
});
