import { z } from "zod";
import { coachTopicSchema, coachThreadSchema, coachMessageSchema, coachMemorySchema, coachActionSchema, coachRunSchema } from "@cadence/shared/coach";
import { ApiRouteError } from "@/lib/api/route";
import { coachDatabaseError, type CoachRequestContext } from "./api";

export async function readCoachRows<T>(read: (offset: number) => PromiseLike<{data: T[] | null;error: {message:string;code?:string} | null}>) {
  const rows: T[] = [];
  for (let offset=0;;offset+=500) {
    const result = await read(offset);
    coachDatabaseError(result.error);
    rows.push(...(result.data ?? []));
    if ((result.data?.length ?? 0)<500) return rows;
  }
}
export async function requireCoachThread(context: CoachRequestContext, id: string) {
  const { data, error } = await context.admin.from("coach_threads").select("*").eq("id", id).eq("owner_id", context.userId).maybeSingle();
  coachDatabaseError(error);
  if (!data) throw new ApiRouteError(404, "thread_not_found", "Conversation not found.");
  return coachThreadSchema.parse(data);
}
export async function requireCoachTopic(context: CoachRequestContext, id: string) {
  const { data, error } = await context.admin.from("coach_topics").select("*").eq("id", id).eq("owner_id", context.userId).maybeSingle();
  coachDatabaseError(error);
  if (!data) throw new ApiRouteError(404, "topic_not_found", "Topic not found.");
  return coachTopicSchema.parse(data);
}
export async function loadCoachBootstrap(context: CoachRequestContext) {
  const home = await context.admin.rpc("ensure_coach_home", { p_owner: context.userId });
  coachDatabaseError(home.error);
  const [topics, threads, memories] = await Promise.all([
    readCoachRows(offset => context.admin.from("coach_topics").select("*").eq("owner_id", context.userId).order("id").range(offset,offset+499)),
    readCoachRows(offset => context.admin.from("coach_threads").select("*").eq("owner_id", context.userId).order("id").range(offset,offset+499)),
    readCoachRows(offset => context.admin.from("coach_memories").select("*").eq("owner_id", context.userId).order("id").range(offset,offset+499)),
  ]);
  return { homeThreadId: home.data, topics: z.array(coachTopicSchema).parse(topics).sort((a,b) => b.updated_at.localeCompare(a.updated_at)), threads: z.array(coachThreadSchema).parse(threads).sort((a,b) => b.updated_at.localeCompare(a.updated_at)), memories: z.array(coachMemorySchema).parse(memories).sort((a,b) => b.updated_at.localeCompare(a.updated_at)) };
}
export async function loadCoachMessages(context: CoachRequestContext, id: string, before?: number) {
  const thread = await requireCoachThread(context, id);
  let query = context.admin.from("coach_messages").select("*").eq("owner_id", context.userId).eq("thread_id", id).order("sequence", { ascending: false }).limit(50);
  if (before !== undefined) query = query.lt("sequence", before);
  const messages = await query;
  coachDatabaseError(messages.error);
  const parsed = z.array(coachMessageSchema).parse(messages.data).reverse();
  const [actions, runs] = await Promise.all([
    readCoachRows(offset => context.admin.from("coach_actions").select("id,owner_id,thread_id,run_id,kind,title,preview,status,result,created_at,applied_at,inverse_of").eq("owner_id", context.userId).eq("thread_id", id).order("id").range(offset,offset+499)),
    context.admin.from("coach_runs").select("*").eq("owner_id", context.userId).eq("thread_id", id).order("created_at", { ascending: false }).limit(10),
  ]);
  coachDatabaseError(runs.error);
  return { thread, messages: parsed, before: parsed.length===50 ? parsed[0].sequence : null, actions: z.array(coachActionSchema).parse(actions), runs: z.array(coachRunSchema).parse(runs.data) };
}
