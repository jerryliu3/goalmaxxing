import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCoachCheckIn } from "@cadence/shared/coach/use-check-in";
import { useCoachConversations, type CoachConversationClient } from "@cadence/shared/coach/use-conversations";
import { mergeCoachConversation } from "@cadence/shared/coach/conversation-state";
import { coachConversationSchema } from "@cadence/shared/coach";
import { digestPayloadSchema } from "@cadence/shared/coach/check-in";

const owner = "11111111-1111-4111-8111-111111111111";
const threadId = "22222222-2222-4222-8222-222222222222";
const topicId = "33333333-3333-4333-8333-333333333333";
const runId = "44444444-4444-4444-8444-444444444444";
const timestamp = "2026-10-01T12:00:00Z";
const thread = { id:threadId,owner_id:owner,topic_id:topicId,title:"Writing",version:0,archived_at:null,legacy_conversation_id:null,created_at:timestamp,updated_at:timestamp };
const conversation = coachConversationSchema.parse({thread,messages:[],runs:[],actions:[],before:null});
const window = {label:"Today",start:"2026-10-01",end:"2026-10-01",placed:0,completed:0,estimatedMinutes:0,items:[]};
const payload = digestPayloadSchema.parse({schemaVersion:"1",id:topicId,kind:"daily",periodKey:"2026-10-01",localDate:"2026-10-01",factsDigest:"facts",historicalFacts:{recap:window,ahead:window,recover:{count:0,items:[]},unscheduled:{count:0,titles:[]}},generatedAt:null,digestAutoShow:true,acknowledged:true,shouldAutoShow:false,facts:{recap:window,ahead:window,recover:{count:0,items:[]},unscheduled:{count:0,titles:[]}},suggestions:null});
const generated = {facts:payload.facts,factsDigest:"facts",suggestions:{motivation:"Ready",suggestions:[]},generatedAt:timestamp};
function deferred<T>() {
  let resolve!: (value:T) => void;
  const promise = new Promise<T>(done => { resolve=done; });
  return {promise,resolve};
}

describe("shared coach lifecycle", () => {
  it("keeps newer action receipts while adding an older page", () => {
    const action = {id:runId,owner_id:owner,thread_id:threadId,run_id:runId,kind:"task_move",title:"Move",preview:{},status:"applied" as const,result:{},created_at:timestamp,applied_at:timestamp,inverse_of:null};
    const old = {...conversation,thread:{...thread,version:3},actions:[action]};
    const merged = mergeCoachConversation(old,{...conversation,thread:{...thread,version:2},before:1,actions:[{...action,status:"proposed"}]},50,false);
    expect(merged.thread.version).toBe(3);
    expect(merged.actions[0].status).toBe("applied");
    expect(merged.before).toBe(1);
  });
  it("restarts pagination when reconnect skips beyond the cached message window", () => {
    const message = (sequence: number) => ({ id: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`, owner_id: owner, thread_id: threadId, sequence, role: "user" as const, content: "Message", run_id: null, source: {}, created_at: timestamp });
    const previous = { ...conversation, thread: { ...thread, version: 20 }, messages: [message(1), message(20)], before: null };
    const latest = { ...conversation, thread: { ...thread, version: 100 }, messages: [message(51), message(100)], before: 51 };
    const recovered = mergeCoachConversation(previous, latest);
    expect(recovered.messages.map(row => row.sequence)).toEqual([51, 100]);
    expect(recovered.before).toBe(51);
    const earlier = mergeCoachConversation(recovered, { ...latest, messages: [message(1), message(50)], before: null }, 51, false);
    expect(earlier.messages.map(row => row.sequence)).toEqual([1, 50, 51, 100]);
    expect(earlier.before).toBeNull();
  });
  it("preserves loaded history when the latest page overlaps it", () => {
    const message = (sequence: number) => ({ id: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`, owner_id: owner, thread_id: threadId, sequence, role: "user" as const, content: "Message", run_id: null, source: {}, created_at: timestamp });
    const previous = { ...conversation, thread: { ...thread, version: 20 }, messages: [message(1), message(20)], before: null };
    const latest = { ...conversation, thread: { ...thread, version: 21 }, messages: [message(20), message(21)], before: 20 };
    expect(mergeCoachConversation(previous, latest).messages.map(row => row.sequence)).toEqual([1, 20, 21]);
    expect(mergeCoachConversation(previous, latest).before).toBeNull();
  });
  it("remembers an accepted run even when the stream and recovery GET disconnect", async () => {
    let offline=false;
    const run = {id:runId,owner_id:owner,thread_id:threadId,user_message_id:owner,topic_version:1,status:"running" as const,error_code:null,context_revision:null,created_at:timestamp,deadline:"2026-10-01T12:01:30Z",completed_at:null};
    const client = {
      createId:()=>runId,
      getJson:vi.fn(async (path:string) => {
        if (offline) throw new Error("Offline");
        return path.endsWith("bootstrap") ? {homeThreadId:threadId,topics:[],threads:[thread],memories:[]} : conversation;
      }),
      postJson:vi.fn(),requestJson:vi.fn(),
      sendTurn:vi.fn<CoachConversationClient["sendTurn"]>(async (_id,_body,_signal,onEvent) => {
        offline=true;
        onEvent({event:"accepted",data:{run}});
        throw new Error("Disconnected");
      }),
    } as unknown as CoachConversationClient;
    const {result} = renderHook(()=>useCoachConversations(client,true));
    await waitFor(()=>expect(result.current.conversation).toBeDefined());
    act(()=>result.current.setDraft("Help me plan today"));
    await act(()=>result.current.send({surface:"plan",scope:"self",hasDraft:false}));
    expect(result.current.conversation?.runs[0]).toMatchObject({id:runId,status:"running"});
    expect(result.current.draft).toBe("");
  });
  it("reloads home after the selected conversation was deleted", async () => {
    const homeId = "55555555-5555-4555-8555-555555555555";
    const home = { ...conversation, thread: { ...thread, id: homeId } };
    let deleted = false;
    const get = vi.fn(async (path: string) => {
      if (path.endsWith("bootstrap")) return { homeThreadId: homeId, topics: [], threads: deleted ? [home.thread] : [thread, home.thread], memories: [] };
      if (path.includes(homeId)) return home;
      if (deleted) throw new Error("Deleted conversation");
      return conversation;
    });
    const client = { getJson: get, postJson: vi.fn(), requestJson: vi.fn(), createId: () => runId, sendTurn: vi.fn() } as unknown as CoachConversationClient;
    const { result } = renderHook(() => useCoachConversations(client, true));
    await waitFor(() => expect(result.current.conversation?.thread.id).toBe(homeId));
    act(() => result.current.setThreadId(threadId));
    await waitFor(() => expect(result.current.conversation?.thread.id).toBe(threadId));
    deleted = true;
    get.mockClear();
    await act(() => result.current.reload());
    expect(result.current.threadId).toBe(homeId);
    expect(get.mock.calls.some(([path]) => path.includes(threadId))).toBe(false);
  });
  it("keeps the current recap and exposes refresh failures", async () => {
    const client = { getJson: vi.fn().mockRejectedValue(new Error("Could not refresh facts")), postJson: vi.fn() } as unknown as Parameters<typeof useCoachCheckIn>[0];
    const { result } = renderHook(() => useCoachCheckIn(client));
    await act(() => result.current.open({ ...payload, suggestions: generated.suggestions }));
    await act(async () => { await expect(result.current.refresh()).rejects.toThrow("Could not refresh facts"); });
    expect(result.current.payload?.facts).toEqual(payload.facts);
    expect(result.current.error).toBe("Could not refresh facts");
  });
  it("does not reopen a closed check-in when generation finishes", async () => {
    const response = deferred<typeof generated>();
    const client = {getJson:vi.fn(),postJson:vi.fn(()=>response.promise)} as unknown as Parameters<typeof useCoachCheckIn>[0];
    const {result} = renderHook(()=>useCoachCheckIn(client),{wrapper:StrictMode});
    let opening!: Promise<void>;
    act(()=>{opening=result.current.open(payload);});
    act(()=>result.current.close());
    await act(async()=>{response.resolve(generated);await opening;});
    expect(result.current.payload).toBeNull();
  });
  it("attaches a reopened check-in to the same pending generation", async () => {
    const response = deferred<typeof generated>();
    const post = vi.fn(()=>response.promise);
    const client = {getJson:vi.fn(),postJson:post} as unknown as Parameters<typeof useCoachCheckIn>[0];
    const {result} = renderHook(()=>useCoachCheckIn(client),{wrapper:StrictMode});
    let first!:Promise<void>;let second!:Promise<void>;
    act(()=>{first=result.current.open(payload);});
    act(()=>result.current.close());
    act(()=>{second=result.current.open(payload);});
    await act(async()=>{response.resolve(generated);await Promise.all([first,second]);});
    expect(post).toHaveBeenCalledTimes(1);
    expect(result.current.payload?.suggestions?.motivation).toBe("Ready");
    expect(result.current.generating).toBe(false);
  });
});
