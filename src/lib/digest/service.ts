import { generateGeminiJson, GeminiRequestError } from "@/lib/ai/gemini";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiRouteError } from "@/lib/api/route";
import type { DigestSuggestions } from "@/lib/digest/contract";
import {
  loadDigestSnapshot,
  updateDigestAutoShow,
  upsertDigestRow,
  type DigestClient,
} from "@/lib/digest/load";
import { buildDigestPrompt, digestGeminiResponseSchema } from "@/lib/digest/prompt";
import {
  fallbackDigestSuggestions,
  parseDigestSuggestions,
} from "@/lib/digest/suggestions";
import {
  consumePlannerAiQuota,
  readDigestQuotaLimit,
} from "@/lib/planner/ai-quota";
import { createAdminClient } from "@/lib/supabase/admin";

const DIGEST_RATE_LIMIT_PER_MINUTE = 10;
const DIGEST_TIMEOUT_MS = 15_000;
const DIGEST_MAX_OUTPUT_TOKENS = 512;

export function digestDisabledError() {
  return new ApiRouteError(503, "digest_disabled", "Digest is not enabled.");
}

export function shouldAutoShowDigest({
  digestAutoShow,
  acknowledgedAt,
}: {
  digestAutoShow: boolean;
  acknowledgedAt: string | null;
}) {
  return digestAutoShow && acknowledgedAt === null;
}

export async function readCurrentDigest({
  supabase,
  userId,
  now,
}: {
  supabase: DigestClient;
  userId: string;
  now?: Date;
}) {
  const snapshot = await loadDigestSnapshot({ supabase, userId, now });
  const suggestions =
    snapshot.record?.suggestions ?? null;
  return {
    kind: snapshot.period.kind,
    periodKey: snapshot.period.periodKey,
    localDate: snapshot.localDate,
    digestAutoShow: snapshot.profile.digestAutoShow,
    acknowledged: snapshot.record?.acknowledgedAt != null,
    shouldAutoShow: shouldAutoShowDigest({
      digestAutoShow: snapshot.profile.digestAutoShow,
      acknowledgedAt: snapshot.record?.acknowledgedAt ?? null,
    }),
    facts: snapshot.facts,
    suggestions,
  };
}

export async function generateCurrentDigest({
  supabase,
  userId,
  regenerate = false,
  now,
}: {
  supabase: DigestClient;
  userId: string;
  regenerate?: boolean;
  now?: Date;
}) {
  const snapshot = await loadDigestSnapshot({ supabase, userId, now });
  if (snapshot.record?.suggestions && !regenerate) {
    return {
      kind: snapshot.period.kind,
      periodKey: snapshot.period.periodKey,
      facts: snapshot.facts,
      suggestions: snapshot.record.suggestions,
      reused: true,
    };
  }

  const rate = checkRateLimit({
    key: `digest:${userId}`,
    limit: DIGEST_RATE_LIMIT_PER_MINUTE,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    throw new ApiRouteError(429, "rate_limited", "Digest is generating too quickly. Try again shortly.");
  }

  const admin = createAdminClient();
  const quota = await consumePlannerAiQuota({
    admin,
    ownerId: userId,
    feature: "digest",
    limit: readDigestQuotaLimit(),
    estimatedInputTokens: 800,
  });
  if (!quota.allowed) {
    if (regenerate) {
      throw new ApiRouteError(429, "quota_exceeded", "Daily digest suggestions are used up.");
    }
    const suggestions = fallbackDigestSuggestions(snapshot.period.kind);
    await upsertDigestRow({
      supabase,
      userId,
      kind: snapshot.period.kind,
      periodKey: snapshot.period.periodKey,
      facts: snapshot.facts,
      suggestions,
    });
    return {
      kind: snapshot.period.kind,
      periodKey: snapshot.period.periodKey,
      facts: snapshot.facts,
      suggestions,
      reused: false,
    };
  }

  let suggestions: DigestSuggestions;
  try {
    const result = await generateGeminiJson({
      prompt: buildDigestPrompt({
        kind: snapshot.period.kind,
        facts: snapshot.facts,
      }),
      responseSchema: digestGeminiResponseSchema,
      temperature: 0.4,
      maxOutputTokens: DIGEST_MAX_OUTPUT_TOKENS,
      totalTimeoutMs: DIGEST_TIMEOUT_MS,
    });
    suggestions =
      parseDigestSuggestions(result.candidateJson) ??
      fallbackDigestSuggestions(snapshot.period.kind);
  } catch (error) {
    if (error instanceof GeminiRequestError) {
      suggestions = fallbackDigestSuggestions(snapshot.period.kind);
    } else {
      throw error;
    }
  }

  await upsertDigestRow({
    supabase,
    userId,
    kind: snapshot.period.kind,
    periodKey: snapshot.period.periodKey,
    facts: snapshot.facts,
    suggestions,
  });

  return {
    kind: snapshot.period.kind,
    periodKey: snapshot.period.periodKey,
    facts: snapshot.facts,
    suggestions,
    reused: false,
  };
}

export async function acknowledgeCurrentDigest({
  supabase,
  userId,
  now,
}: {
  supabase: DigestClient;
  userId: string;
  now?: Date;
}) {
  const snapshot = await loadDigestSnapshot({ supabase, userId, now });
  await upsertDigestRow({
    supabase,
    userId,
    kind: snapshot.period.kind,
    periodKey: snapshot.period.periodKey,
    facts: snapshot.facts,
    suggestions: snapshot.record?.suggestions,
    acknowledgedAt: new Date().toISOString(),
  });
  return {
    kind: snapshot.period.kind,
    periodKey: snapshot.period.periodKey,
    acknowledged: true,
  };
}

export async function setDigestAutoShow({
  supabase,
  userId,
  digestAutoShow,
}: {
  supabase: DigestClient;
  userId: string;
  digestAutoShow: boolean;
}) {
  await updateDigestAutoShow({ supabase, userId, digestAutoShow });
  return { digestAutoShow };
}
