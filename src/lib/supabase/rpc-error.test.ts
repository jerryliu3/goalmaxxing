import { describe, expect, it } from "vitest";
import { getRpcErrorMessage } from "@/lib/supabase/rpc-error";

describe("getRpcErrorMessage", () => {
  it("returns fallback when no message is available", () => {
    expect(getRpcErrorMessage(null, "Fallback")).toBe("Fallback");
  });

  it("returns Error message when present", () => {
    expect(getRpcErrorMessage(new Error("RPC failed"), "Fallback")).toBe("RPC failed");
  });
});
