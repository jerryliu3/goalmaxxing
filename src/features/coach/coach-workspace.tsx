"use client";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCoach } from "./coach-provider";

/** Direct links open the same companion; expansion from the app never navigates. */
export function CoachWorkspace() {
  const coach = useCoach();
  const params = useParams<{ topicId?: string; threadId?: string }>();
  const dispatch = coach?.dispatch;
  const bootstrap = coach?.bootstrap;
  const setThreadId = coach?.setThreadId;
  const setError = coach?.setError;
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (!dispatch || !bootstrap || !setThreadId) return;
    const key = params.threadId ?? "rooms";
    if (opened.current === key) return;
    opened.current = key;
    dispatch({ type: "mode", mode: "expanded" });
    if (params.threadId) {
      const thread = bootstrap.threads.find(row => row.id === params.threadId && row.topic_id === params.topicId);
      if (thread) { setThreadId(thread.id); dispatch({ type: "view", view: "conversation" }); }
      else { setError?.("This conversation is no longer available. Choose another room."); dispatch({ type: "view", view: "rooms" }); }
    } else dispatch({ type: "view", view: "rooms" });
  }, [dispatch, bootstrap, params.threadId, params.topicId, setThreadId, setError]);
  if (!coach) return <p className="py-12 text-muted-foreground">The coach is not enabled yet.</p>;
  return <section className="py-12"><p className="type-eyebrow text-xs text-muted-foreground">Your companion</p><h1 className="type-hero my-4 text-3xl">Room to think.</h1><Button variant="outline" onClick={() => { coach.expand(); coach.showView("rooms"); }}>Open your rooms</Button></section>;
}
