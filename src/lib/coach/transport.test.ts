import { describe, expect, it, vi } from "vitest";
import { CoachTurnRejectedError, sendCoachTurn } from "@cadence/shared/coach/transport";

describe("coach transport recovery boundary", () => {
  it("accepts progress frames split across network chunks without inventing text", async () => {
    const frames = 'event: stage\ndata: {"stage":"context_ready"}\n\nevent: settled\ndata: {"runId":"11111111-1111-4111-8111-111111111111"}\n\n';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode(frames.slice(0, 23)));
      controller.enqueue(new TextEncoder().encode(frames.slice(23))); controller.close();
    } }))));
    const events: string[] = [];
    await sendCoachTurn("thread", { requestId: "11111111-1111-4111-8111-111111111111", expectedVersion: 0, message: "How is this week going?", page: { surface: "progress", scope: "self", hasDraft: false } }, new AbortController().signal, event => events.push(event.event));
    expect(events).toEqual(["stage", "settled"]);
    vi.unstubAllGlobals();
  });
  it("reports a truncated successful HTTP stream as an ambiguous disconnect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('event: stage\ndata: {"stage":"generating"}\n\n')));
    await expect(sendCoachTurn("thread", {requestId:"11111111-1111-4111-8111-111111111111",expectedVersion:0,message:"Help",page:{surface:"plan",scope:"self",hasDraft:false}},new AbortController().signal,vi.fn())).rejects.toThrow("connection was interrupted");
    vi.unstubAllGlobals();
  });
  it("surfaces rejected sends so the draft can be retained", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "This conversation changed. Refresh and try again." }, { status: 409 })));
    await expect(sendCoachTurn("thread", { requestId: "11111111-1111-4111-8111-111111111111", expectedVersion: 0, message: "Help", page: { surface: "plan", scope: "self", hasDraft: false } }, new AbortController().signal, vi.fn())).rejects.toBeInstanceOf(CoachTurnRejectedError);
    vi.unstubAllGlobals();
  });
});
