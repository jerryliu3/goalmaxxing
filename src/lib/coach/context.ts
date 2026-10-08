import { z } from "zod";
import { coachContextSchema, type CoachContext, type CoachPage } from "@cadence/shared/coach";
import { ApiRouteError } from "@/lib/api/route";
import { loadPlannerCanonicalSnapshot } from "@/lib/planner/context-loader";
import { loadDigestProfile } from "@/lib/digest/load";
import { getDateInTimezone } from "@/lib/dates/timezone";
import { addDaysToDateString, getAnchoredPeriod } from "@/lib/goals/periods";
import { buildDigestFacts, type DigestSourceItem } from "@/lib/digest/facts";
import { annotatePlannerSessions } from "@/lib/planner/recovery/snapshot";
import { coachDatabaseError, type CoachRequestContext } from "./api";
import { COACH_SURFACE_PURPOSE } from "./surface-registry";

export async function readCoachRevision(context:CoachRequestContext) {
  const result=await context.admin.from('coach_context_versions').select('revision').eq('owner_id',context.userId).maybeSingle();
  coachDatabaseError(result.error);
  return String(result.data?.revision??0);
}
export function coachWindowCounts(items:DigestSourceItem[],completions:Array<{goalId:string;completedOn:string}>,start:string,end:string) {
  const facts=buildDigestFacts({period:{kind:'weekly',periodKey:start,recapStart:start,recapEnd:end,aheadStart:start,aheadEnd:end},items,goals:[]}).ahead;
  return {scheduled:facts.placed,completed:facts.completed,allCompletions:completions.filter(c=>c.completedOn>=start&&c.completedOn<=end).length};
}
export function coachSelectedWindow(page: CoachPage, today: string, weekStartsOn: number) {
  const date = page.selectedDate ?? today;
  if (page.view === "year") return { start: `${date.slice(0, 4)}-01-01`, end: `${date.slice(0, 4)}-12-31` };
  if (page.view === "day") return { start: date, end: date };
  if (page.view === "three_day") return { start: date, end: addDaysToDateString(date, 2) };
  const period = getAnchoredPeriod(date, page.view === "month" || page.view === "goals" ? "monthly" : "weekly", date, { weekStartsOn });
  return { start: period.start, end: period.end };
}
export async function loadCoachContext(context:CoachRequestContext,page:CoachPage,now=new Date()):Promise<CoachContext> {
  for(let attempt=0;attempt<2;attempt++) {
    const before=await readCoachRevision(context);
    const profile=await loadDigestProfile(context.supabase,context.userId);
    const today=getDateInTimezone(now,profile.timezone);
    const week=getAnchoredPeriod(today,'weekly',today,{weekStartsOn:profile.weekStartsOn});
    const snapshot=await loadPlannerCanonicalSnapshot({supabase:context.supabase,ownerId:context.userId,startDate:week.start,endDate:week.end});
    const goalsById=new Map(snapshot.goals.map(g=>[g.id,g]));
    // Removed or inaccessible page selections must not break the global companion.
    const currentPage = { ...page };
    if (currentPage.selectedGoalId && !goalsById.has(currentPage.selectedGoalId)) delete currentPage.selectedGoalId;
    const allItems = snapshot.persistedItems;
    const raw = allItems.filter(item => item.scheduled_date >= week.start && item.scheduled_date <= week.end);
    const window = coachSelectedWindow(currentPage, today, profile.weekStartsOn);
    let selected = allItems.filter(item => item.scheduled_date >= window.start && item.scheduled_date <= window.end);
    if (currentPage.selectedItemId && !selected.some(item => item.id === currentPage.selectedItemId)) {
      const item = allItems.find(row => row.id === currentPage.selectedItemId && goalsById.has(row.goal_id));
      if (item) selected = [...selected, item];
      else delete currentPage.selectedItemId;
    }
    if (currentPage.selectedGoalId) selected = selected.filter(item => item.goal_id === currentPage.selectedGoalId);
    const completions=snapshot.completions.map(c=>({goalId:c.goal_id,completedOn:c.completed_on}));
    const credited=new Set(annotatePlannerSessions({goals:snapshot.goals,completions:snapshot.completions,items:allItems,asOfDate:today,weekStartsOn:profile.weekStartsOn}).filter(s=>s.credited).map(s=>s.goalId+':'+s.date));
    const toSessions=(rows:typeof raw)=>rows.filter(i=>goalsById.has(i.goal_id)).map(i=>({id:i.id,goalId:i.goal_id,title:goalsById.get(i.goal_id)!.title,unitKey:i.unit_key,date:i.scheduled_date,completed:credited.has(i.goal_id+':'+i.scheduled_date),locked:i.locked}));
    const items=raw.filter(i=>goalsById.has(i.goal_id)).map(i=>({goalId:i.goal_id,title:goalsById.get(i.goal_id)!.title,scheduledDate:i.scheduled_date,credited:credited.has(i.goal_id+':'+i.scheduled_date)}));
    const tasks=[];
    for(let offset=0;;offset+=500) {
      const result=await context.supabase.from('planner_tasks').select('id,title,scheduled_date,completed_at,updated_at').eq('owner_id',context.userId).eq('is_deleted',false).or(`and(scheduled_date.gte.${week.start},scheduled_date.lte.${week.end}),and(scheduled_date.gte.${window.start},scheduled_date.lte.${window.end}),and(scheduled_date.lt.${week.start},completed_at.is.null)`).order('id').range(offset,offset+499);
      coachDatabaseError(result.error);
      const rows=z.array(z.object({id:z.uuid(),title:z.string(),scheduled_date:z.iso.date(),completed_at:z.string().nullable(),updated_at:z.string()})).parse(result.data);
      tasks.push(...rows.map(t=>({id:t.id,title:t.title,date:t.scheduled_date,completed:t.completed_at!==null,updatedAt:t.updated_at})));
      if(rows.length<500) break;
    }
    if (currentPage.selectedTaskId && !tasks.some(task => task.id === currentPage.selectedTaskId)) {
      const result = await context.supabase.from("planner_tasks").select("id,title,scheduled_date,completed_at,updated_at")
        .eq("id", currentPage.selectedTaskId).eq("owner_id", context.userId).eq("is_deleted", false).maybeSingle();
      coachDatabaseError(result.error);
      if (result.data) tasks.push({ id: result.data.id, title: result.data.title, date: result.data.scheduled_date, completed: result.data.completed_at !== null, updatedAt: result.data.updated_at });
      else delete currentPage.selectedTaskId;
    }
    if(before!==await readCoachRevision(context)) continue;
    return coachContextSchema.parse({schemaVersion:1,asOf:now.toISOString(),revision:before,timezone:profile.timezone,timezoneConfirmed:snapshot.preferences!==null,
      today:{date:today,...coachWindowCounts(items,completions,today,today)},week:{start:week.start,end:week.end,weekStartsOn:profile.weekStartsOn,...coachWindowCounts(items,completions,week.start,week.end)},
      page:currentPage,pagePurpose:COACH_SURFACE_PURPOSE[currentPage.surface],scopeNote:page.scope==='duo'?'You are viewing Duo. These facts and all coach actions concern only your own data.':'Your own goals and work.',
      sessions:toSessions(raw),selectedSessions:toSessions(selected),tasks,
      goals:snapshot.goals.map(g=>({id:g.id,title:g.title,startDate:g.start_date,endDate:g.end_date,frequency:g.frequency_type,recurrenceInterval:g.recurrence_interval??null,targetBasis:g.target_basis??null,description:g.description??null,target:g.target_count})),goalsCount:snapshot.goals.length});
  }
  throw new ApiRouteError(409,'context_refresh_required','Your data changed while loading. Try again.');
}
