"use client";
import { z } from "zod";
import { useState } from "react";
import { coachMessageSchema, type CoachMessage } from "@cadence/shared/coach";
import { getJson } from "@/lib/api/client";
export function CoachMessageSources({ids}:{ids:string[]}) {
  const [messages,setMessages]=useState<CoachMessage[]>([]);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  return <details onToggle={async event=>{
    if(!event.currentTarget.open||messages.length||loading)return;
    setLoading(true);setError(null);
    try {
      const result = await getJson<{messages:unknown}>(`/api/coach/messages?ids=${ids.join(",")}`);
      const results = z.array(coachMessageSchema).parse(result.messages);
      setMessages(results);
    }catch(error){setError(error instanceof Error?error.message:"Sources unavailable.");}
    finally{setLoading(false);}
  }}><summary className="mt-1 cursor-pointer text-xs">View source messages</summary>
    {loading&&<p className="mt-2 text-xs">Loading sources…</p>}
    {error&&<p role="alert" className="mt-2 text-xs">{error}</p>}
    {messages.map(message=><blockquote key={message.id} className="mt-2 border-l-2 pl-3 text-xs"><p className="text-muted-foreground">{message.role==="user"?"You":"Coach"} · {new Date(message.created_at).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap">{message.content}</p></blockquote>)}
  </details>;
}
