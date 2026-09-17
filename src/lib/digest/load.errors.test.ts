import { describe, expect, it } from "vitest";
import { ApiRouteError } from "@/lib/api/route";
import { loadDigestProfile, type DigestClient } from "@/lib/digest/load";

function failingClient(error: unknown): DigestClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error }),
        }),
      }),
    }),
  } as unknown as DigestClient;
}

describe("loadDigestProfile", () => {
  it("keeps the Postgres failure as the error cause", async () => {
    const pgError = {
      code: "42703",
      message: 'column profiles.digest_auto_show does not exist',
      hint: null,
    };

    const failure = await loadDigestProfile(failingClient(pgError), "viewer-1").catch(
      (error: unknown) => error
    );

    expect(failure).toBeInstanceOf(ApiRouteError);
    const routeError = failure as ApiRouteError;
    expect(routeError.code).toBe("digest_profile_load_failed");
    expect(routeError.status).toBe(500);
    // The response body echoes details, so the driver payload must not land there.
    expect(routeError.details).toBeUndefined();
    expect((routeError as Error & { cause?: unknown }).cause).toBe(pgError);
  });

  it("reports a missing profile as a 404 without a cause", async () => {
    const failure = await loadDigestProfile(failingClient(null), "viewer-1").catch(
      (error: unknown) => error
    );

    const routeError = failure as ApiRouteError;
    expect(routeError.status).toBe(404);
    expect(routeError.code).toBe("profile_not_found");
  });
});
