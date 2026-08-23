import { describe, expect, it } from "vitest";
import {
  isDemoPathname,
  prefixAppHref,
  withHrefPrefix,
} from "@/lib/navigation/demo-path";

describe("demo path helpers", () => {
  it("detects demo pathnames", () => {
    expect(isDemoPathname("/demo")).toBe(true);
    expect(isDemoPathname("/demo/calendar")).toBe(true);
    expect(isDemoPathname("/calendar")).toBe(false);
    expect(isDemoPathname("/demonstration")).toBe(false);
  });

  it("prefixes app routes and leaves conversion routes alone", () => {
    expect(prefixAppHref("/calendar")).toBe("/demo/calendar");
    expect(prefixAppHref("/calendar?surface=tasks")).toBe(
      "/demo/calendar?surface=tasks"
    );
    expect(prefixAppHref("/goals/new?returnTo=%2Fcalendar")).toBe(
      "/demo/goals/new?returnTo=%2Fcalendar"
    );
    expect(prefixAppHref("/login?next=%2Fcalendar")).toBe("/login?next=%2Fcalendar");
    expect(prefixAppHref("/signup")).toBe("/signup");
    expect(prefixAppHref("/demo/calendar")).toBe("/demo/calendar");
    expect(prefixAppHref("/")).toBe("/");
  });

  it("joins an optional href prefix onto app paths", () => {
    expect(withHrefPrefix("/goals/new", "/demo")).toBe("/demo/goals/new");
    expect(withHrefPrefix("/demo/goals/new", "/demo")).toBe("/demo/goals/new");
    expect(withHrefPrefix("/goals/new")).toBe("/goals/new");
  });
});
