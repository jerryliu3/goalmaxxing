import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LandingPartnerPhonePreview,
  PARTNER_PHONE_NOTIFICATION_DELAY_MS,
  shouldShowPartnerPhone,
  shouldShowPartnerPhoneNotification,
} from "@/components/landing/landing-partner-phone-preview";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("shouldShowPartnerPhone", () => {
  it("shows the phone only in partner week view", () => {
    expect(shouldShowPartnerPhone("partner", true)).toBe(true);
    expect(shouldShowPartnerPhone("partner", false)).toBe(false);
    expect(shouldShowPartnerPhone("solo", true)).toBe(false);
    expect(shouldShowPartnerPhone("duo", true)).toBe(false);
  });
});

describe("shouldShowPartnerPhoneNotification", () => {
  it("waits until the nudge is sent before the phone notification is eligible", () => {
    expect(
      shouldShowPartnerPhoneNotification("partner", "week-typing")
    ).toBe(false);
    expect(
      shouldShowPartnerPhoneNotification("partner", "week-completing")
    ).toBe(false);
    expect(
      shouldShowPartnerPhoneNotification("partner", "week-completed")
    ).toBe(true);
    expect(
      shouldShowPartnerPhoneNotification("partner", "selecting-month")
    ).toBe(true);
    expect(shouldShowPartnerPhoneNotification("solo", "week-completed")).toBe(
      false
    );
  });
});

describe("LandingPartnerPhonePreview", () => {
  it("labels the device and reveals the push notification after a short delay", async () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <LandingPartnerPhonePreview
        notificationEligible={false}
        reducedMotion={false}
        nudgeMessage="You got this!"
      />
    );

    expect(screen.getByText("Alex's phone")).toBeInTheDocument();
    expect(
      screen.queryByTestId("partner-phone-notification")
    ).not.toBeInTheDocument();

    rerender(
      <LandingPartnerPhonePreview
        notificationEligible
        reducedMotion={false}
        nudgeMessage="You got this!"
      />
    );

    expect(
      screen.queryByTestId("partner-phone-notification")
    ).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(PARTNER_PHONE_NOTIFICATION_DELAY_MS - 1);
    });
    expect(
      screen.queryByTestId("partner-phone-notification")
    ).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("partner-phone-notification")).toHaveTextContent(
      "Nudge from your partner"
    );
    expect(screen.getByTestId("partner-phone-notification")).toHaveTextContent(
      "You got this!"
    );
  });

  it("shows the notification immediately with reduced motion", () => {
    render(
      <LandingPartnerPhonePreview
        notificationEligible
        reducedMotion
        nudgeMessage="You got this!"
      />
    );

    expect(screen.getByTestId("partner-phone-notification")).toBeInTheDocument();
  });
});
