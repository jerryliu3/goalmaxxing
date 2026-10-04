import { randomUUID } from "node:crypto";
import { z } from "zod";
import { generateGeminiJson, GeminiRequestError } from "@/lib/ai/gemini";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiRouteError } from "@/lib/api/route";
import { canonicalHash } from "@/lib/planner/canonical";
import { digestSuggestionsSchema } from "./contract";
import { loadDigestSnapshot, updateDigestAutoShow, type DigestClient } from "./load";
import { buildDigestPrompt, digestGeminiResponseSchema } from "./prompt";
import { fallbackDigestSuggestions, parseDigestSuggestions } from "./suggestions";
import { consumePlannerAiQuota, readDigestQuotaLimit } from "@/lib/planner/ai-quota";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability/report-error";

export function digestDisabledError() { return new ApiRouteError(503,"digest_disabled","Check-in is not enabled."); }
export function shouldAutoShowDigest({ digestAutoShow, acknowledged }: { digestAutoShow: boolean; acknowledged: boolean }) { return digestAutoShow && !acknowledged; }
function digestFailure(error: { message: string } | null) {
  if (!error) return;
  if (error.message === "digest_context_changed") throw new ApiRouteError(409,"context_refresh_required","Your data changed while preparing the check-in. Refresh to read the latest facts.");
  if (error.message === "digest_generating") throw new ApiRouteError(409,"digest_generating","This check-in is already being prepared. Open it again shortly.");
  if (error.message === "digest_reference_invalid") throw new ApiRouteError(404,"digest_reference_invalid","This check-in is unavailable. Refresh to open the latest one.");
  throw new ApiRouteError(500,"digest_storage_failed","Your check-in could not be saved.",undefined,error);
}
async function ensureOffer(snapshot: Awaited<ReturnType<typeof loadDigestSnapshot>>,userId: string) {
  const admin=createAdminClient();
  const result=await admin.rpc("ensure_digest_offer",{p_owner:userId,p_kind:snapshot.period.kind,p_key:snapshot.period.periodKey,p_facts:snapshot.facts,p_digest:canonicalHash(snapshot.facts)});
  digestFailure(result.error);
  return z.object({id:z.uuid(),acknowledged_at:z.string().nullable()}).parse(result.data);
}
export async function readCurrentDigest({supabase,userId,now}:{supabase:DigestClient;userId:string;now?:Date}) {
  const snapshot=await loadDigestSnapshot({supabase,userId,now});
  const offer=await ensureOffer(snapshot,userId);
  const presentations=await supabase.from("digest_presentations").select("local_date").eq("owner_id",userId).eq("local_date",snapshot.localDate).maybeSingle();
  digestFailure(presentations.error);
  const factsDigest=canonicalHash(snapshot.facts);
  const sameFacts=snapshot.record?.factsDigest===factsDigest;
  const acknowledged=Boolean(presentations.data || offer.acknowledged_at);
  return { id:offer.id, kind:snapshot.period.kind, periodKey:snapshot.period.periodKey, localDate:snapshot.localDate,
    digestAutoShow:snapshot.profile.digestAutoShow,acknowledged,shouldAutoShow:shouldAutoShowDigest({digestAutoShow:snapshot.profile.digestAutoShow,acknowledged}),
    facts:snapshot.facts,factsDigest, historicalFacts:snapshot.record?.historicalFacts??snapshot.facts,
    suggestions:sameFacts ? snapshot.record?.suggestions??null : null, generatedAt:sameFacts?snapshot.record?.generatedAt??null:null,
  };
}
export async function generateCurrentDigest({supabase,userId,referenceId,now}:{supabase:DigestClient;userId:string;referenceId:string;now?:Date}) {
  const snapshot=await loadDigestSnapshot({supabase,userId,now});
  const offer=await ensureOffer(snapshot,userId);
  if (offer.id!==referenceId) throw new ApiRouteError(409,"digest_period_changed","The check-in period changed. Refresh to open the latest check-in.");
  const factsDigest=canonicalHash(snapshot.facts);
  const admin=createAdminClient();
  const token=randomUUID();
  const claim=await admin.rpc("claim_digest_generation",{p_owner:userId,p_id:referenceId,p_digest:factsDigest,p_token:token});
  digestFailure(claim.error);
  const state=z.object({claimed:z.boolean(),cached:z.unknown(),generatedAt:z.string().nullable().optional()}).parse(claim.data);
  if (!state.claimed) return {kind:snapshot.period.kind,periodKey:snapshot.period.periodKey,facts:snapshot.facts,factsDigest,suggestions:digestSuggestionsSchema.parse(state.cached),generatedAt:state.generatedAt??null,reused:true};
  let completed = false;
  try {
    const rate=checkRateLimit({key:`digest:${userId}`,limit:10,windowMs:60000});
    if (!rate.allowed) throw new ApiRouteError(429,"rate_limited","Please wait before refreshing this check-in.");
    const quota=await consumePlannerAiQuota({admin,ownerId:userId,feature:"digest",limit:readDigestQuotaLimit(),estimatedInputTokens:800});
    let suggestions=fallbackDigestSuggestions(snapshot.period.kind);
    if (quota.allowed) {
      try {
        const response=await generateGeminiJson({prompt:buildDigestPrompt({kind:snapshot.period.kind,facts:snapshot.facts}),responseSchema:digestGeminiResponseSchema,temperature:0.4,maxOutputTokens:512,totalTimeoutMs:15000});
        suggestions=parseDigestSuggestions(response.candidateJson)??suggestions;
      } catch (error) { if (!(error instanceof GeminiRequestError)) throw error; reportError(error,{code:"digest_provider_failed"}); }
    }
    const finished=await admin.rpc("finish_digest_generation",{p_owner:userId,p_id:referenceId,p_token:token,p_facts:snapshot.facts,p_digest:factsDigest,p_suggestions:suggestions,p_revision:snapshot.revision});
    digestFailure(finished.error);
    if (!finished.data) throw new ApiRouteError(409,"digest_generation_expired","This check-in preparation expired. Open it again.");
    completed = true;
    return {kind:snapshot.period.kind,periodKey:snapshot.period.periodKey,facts:snapshot.facts,factsDigest,suggestions,generatedAt:new Date().toISOString(),reused:false};
  } finally {
    if (!completed) {
      const release=await admin.from("user_digests").update({generation_token:null,generation_deadline:null}).eq("id",referenceId).eq("owner_id",userId).eq("generation_token",token);
      if (release.error) reportError(release.error,{code:"digest_generation_release_failed"});
    }
  }
}
export async function acknowledgeDigest({userId,referenceId,localDate}:{userId:string;referenceId:string;localDate:string}) {
  const result=await createAdminClient().rpc("acknowledge_digest_offer",{p_owner:userId,p_id:referenceId,p_day:localDate});
  digestFailure(result.error);
  return {acknowledged:true,claimed:result.data};
}
export async function setDigestAutoShow({supabase,userId,digestAutoShow}:{supabase:DigestClient;userId:string;digestAutoShow:boolean}) {
  await updateDigestAutoShow({supabase,userId,digestAutoShow});return {digestAutoShow};
}
