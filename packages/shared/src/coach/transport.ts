import { coachStreamEventSchema, type CoachTurnRequest } from "./contracts";
import { z } from "zod";
export type CoachStreamEvent = z.infer<typeof coachStreamEventSchema>;

export class CoachTurnRejectedError extends Error {
  constructor(readonly status: number, message: string) { super(message); this.name = "CoachTurnRejectedError"; }
}

/** The server streams actual progress stages; only persisted, validated replies are rendered. */
export async function sendCoachTurn(threadId: string, body: CoachTurnRequest, signal: AbortSignal, onEvent: (event: CoachStreamEvent) => void, options: { baseUrl?: string; headers?: HeadersInit; fetcher?: typeof fetch } = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const response = await (options.fetcher ?? fetch)(`${options.baseUrl ?? ""}/api/coach/threads/${threadId}/turns`, {
    method: "POST", headers, body: JSON.stringify(body), signal,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new CoachTurnRejectedError(response.status, typeof error.message === "string" ? error.message : "The coach could not accept your message.");
  }
  if (!response.body) throw new Error("The response connection was interrupted.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffered += decoder.decode(value, { stream: !done });
      let end: number;
      while ((end = buffered.indexOf("\n\n")) !== -1) {
        const frame = buffered.slice(0, end);
        buffered = buffered.slice(end + 2);
        const event = frame.split("\n").find(line => line.startsWith("event: "))?.slice(7);
        const data = frame.split("\n").find(line => line.startsWith("data: "))?.slice(6);
        if (event && data) {
          const parsed = coachStreamEventSchema.parse({ event, data: JSON.parse(data) });
          if (parsed.event === "settled" || parsed.event === "error") finished = true;
          onEvent(parsed);
        }
      }
      if (done) break;
      if (buffered.length > 128000) throw new Error("The coach response was too large.");
    }
    if (!finished) throw new Error("The connection was interrupted. Reconnect to recover your saved response.");
  } finally { reader.releaseLock(); }
}
