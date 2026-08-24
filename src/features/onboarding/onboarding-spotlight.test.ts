import { afterEach, describe, expect, it } from "vitest";
import {
  firstOnboardingElement,
  isVisibleOnboardingElement,
  queryOnboardingElements,
  readOnboardingTargetRect,
} from "@/features/onboarding/onboarding-spotlight";

describe("onboarding spotlight targeting", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("ignores display-none targets so only the visible nav is highlighted", () => {
    const visible = document.createElement("button");
    visible.setAttribute("data-onboarding", "nav.insights");
    visible.getBoundingClientRect = () => new DOMRect(10, 10, 80, 24);

    const hidden = document.createElement("button");
    hidden.setAttribute("data-onboarding", "nav.insights");
    hidden.getBoundingClientRect = () => new DOMRect(0, 400, 80, 24);

    document.body.append(visible, hidden);

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = ((element: Element) => {
      if (element === hidden) {
        return { display: "none", visibility: "hidden", opacity: "0" } as CSSStyleDeclaration;
      }
      return { display: "block", visibility: "visible", opacity: "1" } as CSSStyleDeclaration;
    }) as typeof window.getComputedStyle;

    expect(isVisibleOnboardingElement(hidden)).toBe(false);
    expect(queryOnboardingElements("nav.insights")).toEqual([visible]);
    expect(firstOnboardingElement(["nav.insights"])).toBe(visible);
    expect(readOnboardingTargetRect(["nav.insights"])).toEqual(
      new DOMRect(10, 10, 80, 24)
    );

    window.getComputedStyle = originalGetComputedStyle;
  });

  it("prefers the narrowest visible tab when mobile and desktop nav both mount", () => {
    const mobile = document.createElement("a");
    mobile.setAttribute("data-onboarding", "nav.insights");
    mobile.getBoundingClientRect = () => new DOMRect(12, 700, 72, 48);

    const desktop = document.createElement("a");
    desktop.setAttribute("data-onboarding", "nav.insights");
    desktop.getBoundingClientRect = () => new DOMRect(12, 120, 320, 56);

    document.body.append(mobile, desktop);

    expect(readOnboardingTargetRect(["nav.insights"])).toEqual(
      new DOMRect(12, 700, 72, 48)
    );
    expect(firstOnboardingElement(["nav.insights"])).toBe(mobile);
  });
});
