"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { createApiClient } from "../api-client";
import { digestPayloadSchema, digestFactsSchema, digestSuggestionsSchema, type DigestPayload } from "./check-in";

type Client = Pick<ReturnType<typeof createApiClient>, "getJson" | "postJson">;
const generatedSchema = z.object({ facts: digestFactsSchema, suggestions: digestSuggestionsSchema, factsDigest: z.string(), generatedAt: z.string().nullable() });

/** Generation belongs to the signed-in controller, so view remounts cannot lose it. */
export function useCoachCheckIn(client: Client) {
  const [payload, setState] = useState<DigestPayload | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<DigestPayload | null>(null);
  const epoch = useRef(0);
  const pending = useRef(new Map<string, Promise<z.infer<typeof generatedSchema>>>());
  const reads = useRef(0);
  useEffect(() => { epoch.current++; return () => { epoch.current++; }; }, []);
  const setPayload = useCallback((next: DigestPayload | null) => {
    reads.current++;
    current.current = next;
    setState(next); setError(null);
  }, []);
  const generate = useCallback(async (next: DigestPayload) => {
    const generation = epoch.current;
    setGeneratingId(next.id); setError(null);
    let request = pending.current.get(next.id);
    if (!request) {
      request = client.postJson("/api/digest/generate", { referenceId: next.id }, { timeoutMs: 60000 }).then(data => generatedSchema.parse(data));
      pending.current.set(next.id, request);
    }
    try {
      const generated = await request;
      if (generation === epoch.current && current.current?.id === next.id && current.current.factsDigest === next.factsDigest) {
        reads.current++;
        const updated = { ...current.current, ...generated };
        current.current = updated; setState(updated);
      }
    } catch (error) {
      if (generation === epoch.current && current.current?.id === next.id) setError(error instanceof Error ? error.message : "Your recap is available; the briefing could not be generated.");
    } finally {
      if (pending.current.get(next.id) === request) pending.current.delete(next.id);
      if (generation === epoch.current) setGeneratingId(id => id === next.id ? null : id);
    }
  }, [client]);
  const open = useCallback(async (offered?: DigestPayload) => {
    const generation = epoch.current;
    const request = ++reads.current;
    try {
      const next = offered ?? digestPayloadSchema.parse(await client.getJson("/api/digest"));
      if (generation !== epoch.current || request !== reads.current) return;
      setPayload(next);
      if (!next.suggestions) await generate(next);
    } catch (error) {
      if (generation === epoch.current && request === reads.current) setError(error instanceof Error ? error.message : "Could not open check-in.");
    }
  }, [client, generate, setPayload]);
  const refresh = useCallback(async (generateBriefing = false) => {
    const previous = current.current;
    if (!previous) return;
    const generation = epoch.current;
    const request = ++reads.current;
    try {
      const next = digestPayloadSchema.parse(await client.getJson("/api/digest"));
      if (generation !== epoch.current || request !== reads.current || current.current?.id !== previous.id) return;
      setPayload(next);
      if (generateBriefing) await generate(next);
    } catch (error) {
      if (generation === epoch.current && request === reads.current) setError(error instanceof Error ? error.message : "Your check-in could not be refreshed.");
      throw error;
    }
  }, [client, generate, setPayload]);
  const close = useCallback(() => setPayload(null), [setPayload]);
  return { payload, open, refresh, generating: payload?.id === generatingId, error, close };
}
