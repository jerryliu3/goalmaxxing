import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DuoActivePartner, DuoScope } from "@cadence/shared/social/duo";
import { AccountMenu } from "./account-menu";

const partner: DuoActivePartner = {
  teamId: "team-1",
  partnerId: "partner-1",
  partnerUsername: "bob",
  partnerDisplayName: "Bob Chen",
  partnerAvatarUrl: "https://example.com/bob.png",
  teamXp: 0,
  teamXpSince: null,
};

const duo = vi.hoisted(() => ({
  scope: "me" as DuoScope,
  activePartner: null as DuoActivePartner | null,
  setScopePreference: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/calendar" }));
vi.mock("@/features/social/duo/duo-context", () => ({
  useDuo: () => ({ viewerLabel: "Alice Park", viewerAvatarUrl: "https://example.com/alice.png" }),
  useDuoScope: () => duo,
}));

function openMenu() {
  const trigger = screen.getByRole("button", { name: /Account menu/ });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter" });
  return trigger;
}

describe("AccountMenu", () => {
  beforeEach(() => {
    duo.scope = "me";
    duo.activePartner = partner;
    duo.setScopePreference.mockReset();
  });
  afterEach(cleanup);

  it("shows whose plan is on screen: one face for Solo, both for Duo", () => {
    const { rerender } = render(<AccountMenu settingsHref="/settings" showPhotos />);
    const trigger = screen.getByRole("button", { name: "Account menu, Solo view" });
    expect([...trigger.querySelectorAll("img")].map(img => img.getAttribute("src"))).toEqual(["https://example.com/alice.png"]);

    duo.scope = "both";
    rerender(<AccountMenu settingsHref="/settings" showPhotos />);
    expect([...screen.getByRole("button", { name: "Account menu, Duo view" }).querySelectorAll("img")].map(img => img.getAttribute("src")))
      .toEqual(["https://example.com/alice.png", "https://example.com/bob.png"]);

    duo.scope = "partner";
    rerender(<AccountMenu settingsHref="/settings" showPhotos />);
    expect([...screen.getByRole("button", { name: "Account menu, Partner view" }).querySelectorAll("img")].map(img => img.getAttribute("src")))
      .toEqual(["https://example.com/bob.png"]);
  });

  it("is the face itself: a 40px photo with no chevron beside it", () => {
    render(<AccountMenu settingsHref="/settings" showPhotos />);
    const trigger = screen.getByRole("button", { name: "Account menu, Solo view" });
    expect(trigger.querySelector("img")?.parentElement).toHaveClass("size-10");
    expect(trigger.querySelector("svg")).toBeNull();
  });

  it("switches the view from the menu and keeps profile one item away", () => {
    render(<AccountMenu settingsHref="/settings" showPhotos />);
    openMenu();

    expect(screen.getByRole("menuitemradio", { name: "Solo" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Partner" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Profile settings" })).toHaveAttribute("href", "/settings");

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Duo" }));
    expect(duo.setScopePreference).toHaveBeenCalledWith("both");
  });

  it("is a plain profile menu without a partner", () => {
    duo.activePartner = null;
    render(<AccountMenu settingsHref="/demo/settings" showPhotos={false} />);
    const trigger = openMenu();

    expect(trigger).toHaveAccessibleName("Account menu");
    expect(trigger.querySelector("img")).toBeNull();
    expect(screen.queryByRole("menuitemradio")).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Profile settings" })).toHaveAttribute("href", "/demo/settings");
  });
});
