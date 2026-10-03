// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isFeatureEnabled: vi.fn(),
  requireAuthenticatedRequestContext: vi.fn(),
  readCurrentDigest: vi.fn(),
  generateCurrentDigest: vi.fn(),
  acknowledgeDigest: vi.fn(),
  setDigestAutoShow: vi.fn(),
}));

vi.mock("@/lib/feature-flags", () => ({
  isFeatureEnabled: mocks.isFeatureEnabled,
}));

vi.mock("@/lib/api/route", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/route")>(
    "@/lib/api/route"
  );
  return {
    ...actual,
    requireAuthenticatedRequestContext: mocks.requireAuthenticatedRequestContext,
  };
});

vi.mock("@/lib/digest/service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/digest/service")>(
    "@/lib/digest/service"
  );
  return {
    ...actual,
    readCurrentDigest: mocks.readCurrentDigest,
    generateCurrentDigest: mocks.generateCurrentDigest,
    acknowledgeDigest: mocks.acknowledgeDigest,
    setDigestAutoShow: mocks.setDigestAutoShow,
  };
});

import { GET } from "./route";
import { POST as generatePost } from "./generate/route";
import { POST as ackPost } from "./ack/route";
import { POST as settingsPost } from "./settings/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function jsonRequest(url: string, body?: unknown) {
  return new Request(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("digest routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFeatureEnabled.mockReturnValue(true);
    mocks.requireAuthenticatedRequestContext.mockResolvedValue({
      supabase: {},
      userId: USER_ID,
    });
  });

  it("returns 503 when the digest flag is off", async () => {
    mocks.isFeatureEnabled.mockReturnValue(false);
    const response = await GET(jsonRequest("http://localhost/api/digest"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "digest_disabled",
    });
  });

  it("returns the current digest payload", async () => {
    mocks.readCurrentDigest.mockResolvedValue({
      kind: "daily",
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
          items: [],
        },
        ahead: {
          label: "Today",
          start: "2026-09-09",
          end: "2026-09-09",
          placed: 1,
          completed: 0,
          items: [],
        },
      },
      suggestions: null,
    });
    const response = await GET(jsonRequest("http://localhost/api/digest"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "1",
      kind: "daily",
      shouldAutoShow: true,
    });
  });

  it("generates suggestions on demand", async () => {
    mocks.generateCurrentDigest.mockResolvedValue({
      kind: "daily",
      periodKey: "2026-09-09",
      facts: {},
      suggestions: { motivation: "Start with today.", suggestions: [] },
      reused: false,
    });
    const response = await generatePost(
      jsonRequest("http://localhost/api/digest/generate", { referenceId: USER_ID })
    );
    expect(response.status).toBe(200);
    expect(mocks.generateCurrentDigest).toHaveBeenCalledWith({
      supabase: {},
      userId: USER_ID,
      referenceId: USER_ID,
    });
  });

  it("acknowledges the current period", async () => {
    mocks.acknowledgeDigest.mockResolvedValue({
      kind: "daily",
      periodKey: "2026-09-09",
      acknowledged: true,
    });
    const response = await ackPost(
      jsonRequest("http://localhost/api/digest/ack", {referenceId:USER_ID,localDate:"2026-09-09"})
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      acknowledged: true,
    });
  });

  it("updates digest auto-show", async () => {
    mocks.setDigestAutoShow.mockResolvedValue({ digestAutoShow: false });
    const response = await settingsPost(
      jsonRequest("http://localhost/api/digest/settings", { digestAutoShow: false })
    );
    expect(response.status).toBe(200);
    expect(mocks.setDigestAutoShow).toHaveBeenCalledWith({
      supabase: {},
      userId: USER_ID,
      digestAutoShow: false,
    });
  });
});
