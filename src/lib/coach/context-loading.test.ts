import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(()=>({snapshot:vi.fn(),profile:vi.fn()}));
vi.mock("@/lib/planner/context-loader",()=>({loadPlannerCanonicalSnapshot:mocks.snapshot}));
vi.mock("@/lib/digest/load",()=>({loadDigestProfile:mocks.profile}));
vi.mock("@/lib/coach/api",()=>({coachDatabaseError:(error:unknown)=>{if(error)throw error;}}));
import { loadCoachContext } from "./context";
const goalId="11111111-1111-4111-8111-111111111111";
const row = {id:"22222222-2222-4222-8222-222222222222",goal_id:goalId,scheduled_date:"2026-10-02",unit_key:"weekly:1",locked:false};
const carryover = {id:"33333333-3333-4333-8333-333333333333",title:"Overdue task",scheduled_date:"2026-09-20",completed_at:null,updated_at:"2026-09-20T12:00:00Z"};
function context() {
  const tasks = {select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),lte:vi.fn().mockReturnThis(),or:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),range:vi.fn().mockResolvedValue({data:[carryover],error:null}),maybeSingle:vi.fn().mockResolvedValue({data:null,error:null})};
  return {
    tasks,
    request: {
      userId: goalId,
      supabase: { from: () => tasks },
      admin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { revision: 1 }, error: null }) }) }) }) },
    },
  };
}
beforeEach(()=>{
  mocks.profile.mockResolvedValue({timezone:"UTC",weekStartsOn:1});
  mocks.snapshot.mockResolvedValue({preferences:{},persistedItems:[row,{...row,id:"44444444-4444-4444-8444-444444444444",scheduled_date:"2026-10-20"}],completions:[],goals:[{id:goalId,title:"Write",start_date:"2026-01-01",end_date:null,frequency_type:"recurring",recurrence_interval:"weekly",target_basis:"period",target_count:1,description:null}]});
});
describe("authoritative coach context loading",()=>{
  it("includes the full selected month and overdue open tasks",async()=>{
    const fixture=context();
    const facts=await loadCoachContext(fixture.request as unknown as Parameters<typeof loadCoachContext>[0],{surface:"plan",view:"month",selectedDate:"2026-10-02",scope:"self",hasDraft:false},new Date("2026-10-02T12:00:00Z"));
    expect(facts.sessions.map(item => item.date)).toEqual(["2026-10-02"]);
    expect(facts.selectedSessions.map(item=>item.date)).toEqual(["2026-10-02","2026-10-20"]);
    expect(facts.tasks[0].date).toBe("2026-09-20");
    expect(fixture.tasks.or).toHaveBeenCalledWith("and(scheduled_date.gte.2026-09-28,scheduled_date.lte.2026-10-04),and(scheduled_date.gte.2026-10-01,scheduled_date.lte.2026-10-31),and(scheduled_date.lt.2026-09-28,completed_at.is.null)");
  });
  it("includes tasks in the visible future window without treating them as this week's work", async () => {
    const fixture = context();
    const future = { ...carryover, scheduled_date: "2026-10-20" };
    fixture.tasks.range.mockResolvedValue({ data: [future], error: null });
    const facts = await loadCoachContext(fixture.request as unknown as Parameters<typeof loadCoachContext>[0], { surface: "plan", view: "day", selectedDate: future.scheduled_date, scope: "self", hasDraft: false }, new Date("2026-10-02T12:00:00Z"));
    expect(fixture.tasks.or).toHaveBeenCalledWith("and(scheduled_date.gte.2026-09-28,scheduled_date.lte.2026-10-04),and(scheduled_date.gte.2026-10-20,scheduled_date.lte.2026-10-20),and(scheduled_date.lt.2026-09-28,completed_at.is.null)");
    expect(facts.tasks[0].date).toBe(future.scheduled_date);
    expect(facts.week.scheduled).toBe(1);
  });
  it("keeps task selection distinct from goal sessions", async () => {
    const fixture = context();
    const facts = await loadCoachContext(fixture.request as unknown as Parameters<typeof loadCoachContext>[0], { surface: "checklist", selectedTaskId: carryover.id, scope: "self", hasDraft: false }, new Date("2026-10-02T12:00:00Z"));
    expect(facts.page.selectedTaskId).toBe(carryover.id);
    expect(facts.page.selectedItemId).toBeUndefined();
    expect(facts.tasks.find(task => task.id === carryover.id)?.title).toBe("Overdue task");
  });
  it("drops inaccessible selections without losing the current week",async()=>{
    const fixture=context();
    const facts=await loadCoachContext(fixture.request as unknown as Parameters<typeof loadCoachContext>[0],{surface:"goal",selectedGoalId:"99999999-9999-4999-8999-999999999999",scope:"self",hasDraft:false},new Date("2026-10-02T12:00:00Z"));
    expect(facts.page.selectedGoalId).toBeUndefined();
    expect(facts.week.scheduled).toBe(1);
    expect(facts.goals.map(goal=>goal.id)).toEqual([goalId]);
  });
  it("resolves an explicitly selected future task through the owned task path", async () => {
    const fixture = context();
    const future = { ...carryover, id: "55555555-5555-4555-8555-555555555555", scheduled_date: "2026-11-01" };
    fixture.tasks.maybeSingle.mockResolvedValue({ data: future, error: null });
    const facts = await loadCoachContext(fixture.request as unknown as Parameters<typeof loadCoachContext>[0], { surface: "checklist", selectedTaskId: future.id, scope: "self", hasDraft: false }, new Date("2026-10-02T12:00:00Z"));
    expect(fixture.tasks.eq).toHaveBeenCalledWith("owner_id", goalId);
    expect(facts.tasks.find(task => task.id === future.id)?.date).toBe("2026-11-01");
    expect(facts.week.scheduled).toBe(1);
  });
  it("drops a deleted or inaccessible task selection", async () => {
    const fixture = context();
    const facts = await loadCoachContext(fixture.request as unknown as Parameters<typeof loadCoachContext>[0], { surface: "checklist", selectedTaskId: "55555555-5555-4555-8555-555555555555", scope: "self", hasDraft: false }, new Date("2026-10-02T12:00:00Z"));
    expect(facts.page.selectedTaskId).toBeUndefined();
  });
});
