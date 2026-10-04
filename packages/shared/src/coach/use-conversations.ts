"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { createApiClient } from "../api-client";
import { coachBootstrapSchema, coachConversationSchema, coachRunSchema, type CoachConversation, type CoachPage, type CoachRun, type CoachTurnRequest } from "./contracts";
import { CoachTurnRejectedError, type sendCoachTurn } from "./transport";
import { mergeCoachConversation } from "./conversation-state";

type Bootstrap = ReturnType<typeof coachBootstrapSchema.parse>;
export type CoachConversationClient = Pick<ReturnType<typeof createApiClient>, "getJson" | "postJson" | "requestJson"> & {
  createId: () => string;
  sendTurn: typeof sendCoachTurn;
};
export function useCoachConversations(client: CoachConversationClient, visible: boolean) {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Record<string, CoachConversation>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draftValues = useRef(drafts);
  draftValues.current = drafts;
  const [stages, setStages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const transports = useRef(new Map<string, AbortController>());
  const pending = useRef(new Map<string, CoachTurnRequest>());
  const references = useRef(new Map<string, CoachTurnRequest["checkIn"]>());
  const epoch = useRef(0);
  const requests = useRef(new Map<string, number>());
  const bootstrapRequest = useRef(0);
  useEffect(() => {
    epoch.current++;
    return () => { epoch.current++; for (const controller of transports.current.values()) controller.abort(); };
  }, []);
  const loadBootstrap = useCallback(async () => {
    const generation = epoch.current;
    const request = ++bootstrapRequest.current;
    const data = coachBootstrapSchema.parse(await client.getJson("/api/coach/bootstrap"));
    if (generation === epoch.current && request === bootstrapRequest.current) {
      const ids = new Set(data.threads.map(thread => thread.id));
      for (const [id, transport] of transports.current) if (!ids.has(id)) { transport.abort(); pending.current.delete(id); }
      setConversations(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => ids.has(id))));
      setDrafts(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => ids.has(id))));
      setStages(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => ids.has(id))));
      for (const id of references.current.keys()) if (!ids.has(id)) references.current.delete(id);
      setBootstrap(data);
      setThreadId(id => data.threads.some(thread => thread.id === id) ? id : data.homeThreadId);
    }
    return data;
  }, [client]);
  const loadConversation = useCallback(async (id: string, before?: number) => {
    const generation = epoch.current;
    const request = (requests.current.get(id) ?? 0) + 1;
    if (before === undefined) requests.current.set(id, request);
    const data = coachConversationSchema.parse(await client.getJson(`/api/coach/threads/${id}/messages${before !== undefined ? `?before=${before}` : ""}`));
    if (generation !== epoch.current) return;
    const current = before === undefined && request === requests.current.get(id);
    setConversations(previous => ({ ...previous, [id]: mergeCoachConversation(previous[id], data, before, current) }));
    if (current) {
      setBootstrap(old => old ? { ...old, threads: old.threads.map(thread => thread.id === id && thread.version <= data.thread.version ? data.thread : thread) } : old);
      const body = pending.current.get(id);
      if (body && data.runs.some(run => run.id === body.requestId)) {
        pending.current.delete(id);
        setDrafts(old => ({ ...old, [id]: old[id]?.trim() === body.message ? "" : old[id] }));
        if (draftValues.current[id]?.trim() === body.message) references.current.delete(id);
      }
    }
  }, [client]);
  const reload = useCallback(async () => {
    const data = await loadBootstrap();
    const selected = data.threads.some(thread => thread.id === threadId) ? threadId : data.homeThreadId;
    if (selected) await loadConversation(selected);
  }, [loadBootstrap, loadConversation, threadId]);
  useEffect(() => {
    if (visible && !bootstrap) void loadBootstrap().catch(error => setError(error.message));
  }, [visible, bootstrap, loadBootstrap]);
  useEffect(() => {
    if (visible && threadId) void loadConversation(threadId).catch(error => setError(error.message));
  }, [visible, threadId, loadConversation]);
  const runningKey = Object.values(conversations).flatMap(conversation => conversation.runs.filter(run => run.status === "running").map(run => `${run.thread_id}:${run.id}`)).join(",");
  useEffect(() => {
    if (!runningKey) return;
    let stopped = false;
    let reading = false;
    const recover = async () => {
      if (reading) return;
      reading = true;
      try {
        for (const entry of runningKey.split(",")) {
          const [id, runId] = entry.split(":");
          try {
            const { run } = await client.getJson<{ run: unknown }>(`/api/coach/runs/${runId}`);
            if (!stopped && coachRunSchema.parse(run).status !== "running") { await loadConversation(id); await loadBootstrap(); }
          } catch { /* Recover persisted state on the next poll; never replay the model. */ }
        }
      } finally { reading = false; }
    };
    const interval = setInterval(() => void recover(), 3000);
    return () => { stopped = true; clearInterval(interval); };
  }, [client, runningKey, loadConversation, loadBootstrap]);

  const send = async (page: CoachPage, retry?: CoachRun) => {
    if (!threadId || transports.current.has(threadId)) return;
    const id = threadId;
    const conversation = conversations[id];
    if (!conversation || conversation.runs.some(run => run.status === "running")) return;
    const text = retry ? conversation.messages.find(message => message.id === retry.user_message_id)?.content : drafts[id];
    if (!text?.trim()) return;
    const checkIn = retry ? undefined : references.current.get(id);
    const body = pending.current.get(id) ?? { requestId: client.createId(), expectedVersion: conversation.thread.version, message: text.trim(), page, ...(checkIn ? { checkIn } : {}), ...(retry ? { retryRunId: retry.id } : {}) };
    const generation = epoch.current;
    const controller = new AbortController();
    transports.current.set(id, controller); pending.current.set(id, body);
    setError(null); setStages(old => ({ ...old, [id]: "Connecting…" }));
    try {
      await client.sendTurn(id, body, controller.signal, event => {
        if (generation !== epoch.current) return;
        if (event.event === "accepted") {
          pending.current.delete(id);
          if (!retry) {
            setDrafts(old => ({ ...old, [id]: old[id]?.trim() === body.message ? "" : old[id] }));
            if (draftValues.current[id]?.trim() === body.message && references.current.get(id) === checkIn) references.current.delete(id);
          }
          // Remember acceptance immediately, even if the subsequent GET is offline.
          requests.current.set(id, (requests.current.get(id) ?? 0) + 1);
          setConversations(old => old[id] ? { ...old, [id]: { ...old[id], runs: [event.data.run, ...old[id].runs.filter(run => run.id !== event.data.run.id)] } } : old);
          setStages(old => ({ ...old, [id]: "Reading your latest data…" }));
          void loadConversation(id).catch(() => undefined);
        }
        if (event.event === "stage") setStages(old => ({ ...old, [id]: event.data.stage === "generating" ? "Thinking…" : "Reading your latest data…" }));
        if (event.event === "error") setError(event.data.message);
      });
    } catch (error) {
      if (error instanceof CoachTurnRejectedError && error.status < 500 && error.status !== 408) pending.current.delete(id);
      if (generation === epoch.current && !controller.signal.aborted) setError(error instanceof Error ? error.message : "Connection interrupted. Your saved response will appear when it finishes.");
    } finally {
      const active = transports.current.get(id);
      if (active === controller) transports.current.delete(id);
      if (generation === epoch.current) {
        if (!active || active === controller) setStages(old => ({ ...old, [id]: "" }));
        await loadConversation(id).catch(() => undefined);
        await loadBootstrap().catch(() => undefined);
      }
    }
  };
  const cancel = async (run: CoachRun) => {
    await client.requestJson({ path: `/api/coach/runs/${run.id}`, method: "DELETE" });
    transports.current.get(run.thread_id)?.abort();
    transports.current.delete(run.thread_id);
    setStages(old => ({ ...old, [run.thread_id]: "" }));
    await loadConversation(run.thread_id);
  };
  const create = async (kind: "topic" | "thread", title: string, topicId?: string) => {
    const path = kind === "topic" ? "/api/coach/topics" : `/api/coach/topics/${topicId}/threads`;
    const created = await client.postJson<{ thread: Bootstrap["threads"][number] }>(path, { title });
    await loadBootstrap(); setThreadId(created.thread.id); return created.thread;
  };
  return { bootstrap, threadId, setThreadId, conversations, conversation: threadId ? conversations[threadId] : undefined,
    draft: threadId ? drafts[threadId] ?? "" : "",
    setDraft: (value: string, checkIn?: CoachTurnRequest["checkIn"]) => {
      if (!threadId) return;
      setDrafts(old => ({ ...old, [threadId]: value }));
      if (checkIn) references.current.set(threadId, checkIn);
      if (!value.trim()) references.current.delete(threadId);
    },
    stages, error, setError, send, cancel, create, loadBootstrap, loadConversation, reload,
  };
}
