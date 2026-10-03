import { describe, expect, it, vi } from "vitest";
import { coachProposalSchema } from "./capabilities";
import { prepareCoachAction, prepareCoachProposals } from "./actions";
import { ApiRouteError } from "@/lib/api/route";
import { coachApplySchema } from "./action-service";
const { snapshot } = vi.hoisted(() => ({ snapshot: vi.fn() }));
vi.mock("@/lib/planner/context-loader", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/planner/context-loader")>(), loadPlannerCanonicalSnapshot: snapshot,
}));
const id = "11111111-1111-4111-8111-111111111111";
describe("coach action authority", () => {
  it("accepts only a sealed action identity and reviewed page on Apply", () => {
    expect(coachApplySchema.safeParse({ requestId: id, page: { surface: "plan" }, command: { sql: "anything" } }).success).toBe(false);
    expect(coachApplySchema.safeParse({ requestId: id, page: { surface: "plan", hasDraft: true } }).success).toBe(true);
  });
  it("rejects arbitrary model tools and ownership claims", () => {
    expect(coachProposalSchema.safeParse({ kind: "delete_goal", goalId: id, title: "Delete" }).success).toBe(false);
    expect(coachProposalSchema.safeParse({ kind: "completion", goalId: id, date: "2026-10-01", completed: true, title: "Complete", ownerId: id }).success).toBe(false);
  });
  it("prepares rest-day changes with the canonical revisions digest", async () => {
    snapshot.mockResolvedValue({ revisions: { scheduleDigest: "reviewed-digest" }, preferences: { default_policy: { restWeekdays: [0] } } });
    const action = await prepareCoachAction({} as Parameters<typeof prepareCoachAction>[0],
      { kind: "preference", title: "Rest Saturday", restWeekdays: [6] },
      { timezoneConfirmed: true, timezone: "UTC", today: { date: "2026-10-01" }, week: { start: "2026-09-28", end: "2026-10-04" } } as Parameters<typeof prepareCoachAction>[2]);
    expect(action.command).toMatchObject({ expectedDigest: "reviewed-digest", restWeekdays: [6] });
    expect(action.preview).toMatchObject({ before: { restWeekdays: [0] }, after: { restWeekdays: [6] } });
  });
  it("does not disguise storage failures as rejected model suggestions", async () => {
    snapshot.mockRejectedValue(new ApiRouteError(500, "coach_storage_failed", "Storage unavailable"));
    await expect(prepareCoachProposals({} as Parameters<typeof prepareCoachProposals>[0],
      [{kind:"preference",title:"Rest",restWeekdays:[0]}],
      {timezoneConfirmed:true,week:{start:"2026-09-28",end:"2026-10-04"},today:{date:"2026-10-01"}} as Parameters<typeof prepareCoachProposals>[2]
    )).rejects.toMatchObject({code:"coach_storage_failed"});
  });
});
