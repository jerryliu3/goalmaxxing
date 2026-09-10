import { describe, expect, it } from "vitest";
import { addGoal, createSeed, defaultDraft, draftError, moveItems, navigateDate, periodDays, TODAY, toggleCompletion } from "./model";
describe("interaction study state", () => {
  it("moves across month boundaries without changing recorded history", () => {
    const before=createSeed(); const item=before.items.find(i => i.id==="p1-0")!;
    const after=moveItems(before,{ids:[item.id,"u1"],date:"2026-10-03"});
    expect(after.items.filter(i => [item.id,"u1"].includes(i.id)).every(i => i.date==="2026-10-03")).toBe(true);
    expect(after.records).toEqual(before.records); expect(before.items.find(i => i.id===item.id)?.date).toBe("2026-09-01");
  });
  it("keeps completion on the selected date and reverses linked credit with its source", () => {
    const original=createSeed(); const d={...defaultDraft(TODAY),title:"Gym",linkedTo:"g0"}; const seed=addGoal(original,d); const item=seed.items.at(-1)!;
    const done=toggleCompletion(seed,item,TODAY); expect(done.records.length).toBe(seed.records.length+2);
    expect(done.records.at(-1)?.source).toBe("linked_cascade");
    expect(toggleCompletion(done,item,TODAY).records).toEqual(seed.records);
  });
  it("creates real named milestones and keeps tasks separate from goals", () => {
    const seed=createSeed(); const d={...defaultDraft(TODAY),title:"Portfolio",kind:"fixed_milestones" as const,milestones:"Draft\nPublish"};
    const next=addGoal(seed,d); expect(next.goals.at(-1)?.target_count).toBe(2); expect(next.items.slice(-2).map(i => i.title)).toEqual(["Draft","Publish"]);
    const task=addGoal(seed,{...d,kind:"planner_task"}); expect(task.goals).toEqual(seed.goals); expect(task.items.at(-1)?.goalId).toBeNull(); expect(task.items.at(-1)?.date).toBeNull();
  });
  it("rejects invalid drafts and retains a lifetime target", () => {
    const d=defaultDraft(TODAY); expect(draftError(d)).toBeTruthy(); expect(draftError({...d,title:"Read",target:0})).toBeTruthy(); expect(draftError({...d,title:"Read",end:"2026-01-01"})).toBeTruthy();
    expect(addGoal(createSeed(),{...d,title:"Read",basis:"lifetime",target:30}).goals.at(-1)?.target_basis).toBe("lifetime");
  });
  it("supports real month and week date ranges including month boundaries", () => {
    expect(periodDays("2026-09-09","month")).toHaveLength(35); expect(periodDays("2026-09-09","week")[0]).toBe("2026-09-07"); expect(navigateDate("2026-09-30","day",1)).toBe("2026-10-01");
  });
});
