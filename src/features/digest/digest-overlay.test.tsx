import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JOURNEY_INTRO_SEEN_KEY,
  JOURNEY_ONBOARDING_COMPLETED_KEY,
} from "@/components/intro/journey-intro-overlay";
import { DigestOverlay } from "@/features/digest/digest-overlay";
import { DIGEST_OPEN_EVENT } from "@/features/digest/digest-api";

const mocks = vi.hoisted(() => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
  postJson: mocks.postJson,
  getApiErrorMessage: () => "error",
}));

const digestPayload = {
  schemaVersion: "1" as const,
  kind: "daily" as const,
  periodKey: "2026-09-09",
  localDate: "2026-09-09",
  digestAutoShow: true,
  acknowledged: false,
  shouldAutoShow: true,
  facts: {
    recap: {
      label: "Yesterday",
      start: "2026-09-08",
      end: "2026-09-08",
      placed: 1,
      completed: 0,
      items: [{ title: "Strength", date: "2026-09-08", state: "open" as const }],
    },
    ahead: {
      label: "Today",
      start: "2026-09-09",
      end: "2026-09-09",
      placed: 1,
      completed: 0,
      items: [{ title: "Tempo run", date: "2026-09-09", state: "open" as const }],
    },
  },
  suggestions: null,
};

describe("DigestOverlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.getJson.mockResolvedValue(digestPayload);
    mocks.postJson.mockResolvedValue({
      suggestions: {
        motivation: "Start with Tempo run.",
        suggestions: [],
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not auto-open before onboarding is finished", async () => {
    render(<DigestOverlay />);
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays hidden when digest is disabled", async () => {
    mocks.getJson.mockRejectedValue(new Error("digest_disabled"));
    render(<DigestOverlay />);
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens on replay even after the period was acknowledged", async () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, "2026-01-01");
    mocks.getJson.mockResolvedValue({
      ...digestPayload,
      acknowledged: true,
      shouldAutoShow: false,
    });
    render(<DigestOverlay />);
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();

    window.dispatchEvent(new Event(DIGEST_OPEN_EVENT));
    expect(await screen.findByRole("dialog", { name: /daily digest/i })).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
  });

  it("acks when skipped", async () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, "2026-01-01");
    const user = userEvent.setup();
    render(<DigestOverlay />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(mocks.postJson).toHaveBeenCalledWith("/api/digest/ack", {});
  });
});
