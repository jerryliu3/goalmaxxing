"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { initialState, reducer, replyFor } from "./model";

export function usePrototype() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [offline, setOffline] = useState(false);
  const timers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; question: string }>());
  useEffect(() => {
    const active = timers.current;
    return () => { active.forEach(entry => clearTimeout(entry.timer)); active.clear(); };
  }, []);
  function stop(threadId = state.threadId) {
    const entry = timers.current.get(threadId);
    if (!entry) return;
    clearTimeout(entry.timer);
    timers.current.delete(threadId);
    setPending(current => { const next = { ...current }; delete next[threadId]; return next; });
    dispatch({ type: "message", threadId, message: { id: crypto.randomUUID(), role: "coach", text: "Stopped. Your message is kept in this conversation. You can continue whenever you’re ready." } });
  }
  function send(text?: string) {
    const thread = state.threads.find(row => row.id === state.threadId)!;
    const question = (text ?? thread.draft).trim();
    if (!question || timers.current.has(thread.id)) return;
    if (offline) {
      if (text) dispatch({ type: "draft", threadId: thread.id, value: question });
      dispatch({ type: "view", value: "conversation" });
      dispatch({ type: "notice", value: "You’re offline. Your draft is kept; reconnect to send it." });
      return;
    }
    const id = crypto.randomUUID();
    const reply = replyFor(state, question, id);
    dispatch({ type: "view", value: "conversation" });
    dispatch({ type: "message", threadId: thread.id, message: { id: `${id}-user`, role: "user", text: question } });
    dispatch({ type: "draft", threadId: thread.id, value: "" });
    setPending(current => ({ ...current, [thread.id]: question }));
    const timer = setTimeout(() => {
      dispatch({ type: "message", threadId: thread.id, message: reply });
      timers.current.delete(thread.id);
      setPending(current => { const next = { ...current }; delete next[thread.id]; return next; });
    }, 950);
    timers.current.set(thread.id, { timer, question });
  }
  function reset() {
    timers.current.forEach(entry => clearTimeout(entry.timer)); timers.current.clear();
    setPending({}); setOffline(false); dispatch({ type: "reset" });
  }
  return { state, dispatch, pending, offline, setOffline, send, stop, reset };
}
export type Prototype = ReturnType<typeof usePrototype>;
