import { describe, expect, it } from "vitest";
import { buildLoginHref, resolveSafePostLoginPath } from "./login-redirect";

describe("login redirect helpers", () => {
  it("keeps safe in-origin relative destinations", () => {
    expect(resolveSafePostLoginPath("/insights?tab=year#focus")).toBe(
      "/insights?tab=year#focus"
    );
  });

  it("blocks protocol-relative destinations", () => {
    expect(resolveSafePostLoginPath("//evil.com/phish")).toBe("/calendar");
  });

  it("blocks backslash-normalized external destinations", () => {
    expect(resolveSafePostLoginPath("/\\evil.com/phish")).toBe("/calendar");
  });

  it("blocks absolute external URLs", () => {
    expect(resolveSafePostLoginPath("https://evil.com/phish")).toBe("/calendar");
  });

  it("blocks redirects back into login routes", () => {
    expect(resolveSafePostLoginPath("/login")).toBe("/calendar");
    expect(resolveSafePostLoginPath("/login/reset")).toBe("/calendar");
    expect(resolveSafePostLoginPath("/")).toBe("/calendar");
  });

  it("blocks demo sandbox destinations after a real login", () => {
    expect(resolveSafePostLoginPath("/demo")).toBe("/calendar");
    expect(resolveSafePostLoginPath("/demo/calendar")).toBe("/calendar");
  });

  it("builds login href with sanitized next parameter", () => {
    expect(buildLoginHref("/\\evil.com")).toBe("/login?next=%2Fcalendar");
    expect(buildLoginHref("/settings?tab=profile")).toBe(
      "/login?next=%2Fsettings%3Ftab%3Dprofile"
    );
  });
});
