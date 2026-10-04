import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ preview: vi.fn(), publish: vi.fn(), completion: vi.fn() }));
vi.mock("@/app/api/planner/context/route", () => ({ GET: vi.fn(), POST: mocks.preview }));
vi.mock("@/app/api/planner/save/route", () => ({ POST: mocks.publish }));
vi.mock("@/app/api/completions/route", () => ({ POST: mocks.completion }));
vi.mock("@/app/api/progress/context/route", () => ({ GET: vi.fn() }));
vi.mock("@/app/api/planner/tasks/route", () => ({ GET: vi.fn() }));
vi.mock("@/app/api/planner/tasks/[taskId]/schedule/route", () => ({ POST: vi.fn() }));
vi.mock("@/app/api/planner/tasks/[taskId]/completion/route", () => ({ POST: vi.fn() }));
vi.mock("@/lib/env", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://goalmaxxing.app" }) }));
import { executeOperation } from "./operations";
import type { ExternalContext } from "./auth";
import { runPlannerKernel } from "@/lib/planner/kernel";
import { createDefaultPlannerPolicy } from "@/lib/planner/policy";
import { operationSchemas } from "./schemas";
const owner = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
describe("shared deterministic account operations", () => {
  beforeEach(() => vi.clearAllMocks());
  it("preserves planner stale-preview failures and bearer identity", async () => {
    mocks.publish.mockResolvedValue(Response.json({ code: "stale_revision", message: "Refresh plan.", correlationId: "canonical" }, { status: 409 }));
    const context = { userId: owner, token: "user-token" } as ExternalContext;
    await expect(executeOperation(context, "publish_plan", { expectedDigest: "a".repeat(64), startDate: "2026-10-01", endDate: "2026-10-31", previewHash: "b".repeat(64), confirmationHash: null })).rejects.toMatchObject({ status: 409, code: "stale_revision" });
    const request = mocks.publish.mock.calls[0][0] as Request;
    expect(request.headers.get("authorization")).toBe("Bearer user-token");
    expect(new URL(request.url).pathname).toMatch(/^\/api\/v1\//);
  });
  it("returns a ready publish request from the exact stable preview", async () => {
    const policy = createDefaultPlannerPolicy("UTC", "2026-10-04T00:00:00Z");
    const preview = runPlannerKernel({ schemaVersion: "1", eligibilityMode: "overlap_v1", ownerId: owner, startDate: "2026-10-01", endDate: "2026-10-31", asOfDate: "2026-10-04", timezone: "UTC", goals: [], completions: [], links: [], policy, basePlan: null });
    mocks.preview.mockResolvedValue(Response.json({ preview, policy, revisions: { scheduleDigest: "a".repeat(64) } }));
    const result = await executeOperation({ userId: owner, token: "token" } as ExternalContext, "preview_plan", { startDate: "2026-10-01", endDate: "2026-10-31" });
    expect(result.publishRequest).toMatchObject({ expectedDigest: "a".repeat(64), previewHash: preview.generationInputHash, preserveExistingAssignments: preview.preserveExistingAssignments, confirmationHash: null, policy });
    const proposal = await executeOperation({ userId: owner, token: "token" } as ExternalContext, "preview_plan", { startDate: "2026-10-01", endDate: "2026-10-31", solveIntent: "replan" });
    expect(proposal.publishRequest).toBeNull();
  });
  it("prevents completion writes to a goal outside the connected account", async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const context = { userId: owner, token: "token", supabase: { from: () => chain } } as unknown as ExternalContext;
    await expect(executeOperation(context, "set_completion", { goalId: requestId, date: "2026-10-04", desiredFactState: "present" })).rejects.toMatchObject({ status: 404 });
    expect(chain.eq).toHaveBeenCalledWith("owner_id", owner); expect(mocks.completion).not.toHaveBeenCalled();
  });
  it("uses the database's durable receipt for creation retries", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { task_id: requestId, title: "Read" }, error: null });
    const context = { userId: owner, supabase: { rpc } } as unknown as ExternalContext;
    await executeOperation(context, "create_task", { requestId, title: "Read", scheduledDate: "2026-10-04" });
    expect(rpc).toHaveBeenCalledWith("external_account_mutation", { p_request_id: requestId, p_operation: "create_task", p_payload: { title: "Read", scheduled_date: "2026-10-04", scheduled_time: null } });
    rpc.mockResolvedValueOnce({ data: null, error: { code: "22023", message: "idempotency_conflict" } });
    await expect(executeOperation(context, "create_task", { requestId, title: "Changed", scheduledDate: "2026-10-04" })).rejects.toMatchObject({ status: 409, code: "idempotency_conflict" });
  });
  it("rejects incomplete schedules, extra AI instructions, and impossible goal dates", () => {
    expect(operationSchemas.create_goal.safeParse({ requestId, goal: { title: "Read", frequencyType: "recurring", startDate: "2026-10-04" } }).success).toBe(false);
    expect(operationSchemas.preview_plan.safeParse({ startDate: "2026-10-01", endDate: "2026-10-31", prompt: "Call your AI" }).success).toBe(false);
    expect(operationSchemas.create_goal.safeParse({ requestId, goal: { title: "Read", frequencyType: "recurring", recurrenceInterval: "daily", startDate: "2026-10-10", endDate: "2026-10-01" } }).success).toBe(false);
  });
});
