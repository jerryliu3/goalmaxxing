import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { goalFor, type StudyState } from "../model";
import { CategoryControl, GoalControl, SearchControl, ViewControl, type PlannerControlsProps } from "./controls";
import s from "./planner.module.css";

type ViewDraft = Pick<StudyState, "view" | "category" | "query" | "plannerGoalId">;
function viewDraft(state: StudyState): ViewDraft {
  return { view: state.view, category: state.category, query: state.query, plannerGoalId: state.plannerGoalId };
}

export function ViewComposer({ state, update }: PlannerControlsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => viewDraft(state));
  const stagedState = { ...state, ...draft };
  const scope = state.plannerGoalId ? goalFor(state.plannerGoalId).title : state.category === "All" ? "all goals" : state.category.toLowerCase();
  return <Dialog open={open} onOpenChange={next => {
    if (next) setDraft(viewDraft(state));
    setOpen(next);
  }}>
    <div className={s.viewSentence}>
      <div><span>Your view</span><p><strong>{scope}</strong>, by <strong>{state.view.toLowerCase()}</strong>.</p>
        {state.query.trim() && <small>Matching “{state.query.trim()}”</small>}
      </div>
      <DialogTrigger asChild><button className={s.action}><SlidersHorizontal size={15} />Change view</button></DialogTrigger>
    </div>
    <DialogContent className={s.composerDialog}>
      <DialogTitle>Compose your view</DialogTitle>
      <DialogDescription>Choose what you want to see. Your calendar changes when you apply.</DialogDescription>
      <div className={s.field}><span>Time scale</span><ViewControl state={stagedState} update={patch => setDraft(current => ({ ...current, ...patch }))} /></div>
      <div className={s.field}><span>Category</span><CategoryControl state={stagedState} update={patch => setDraft(current => ({ ...current, ...patch }))} /></div>
      <GoalControl state={stagedState} update={patch => setDraft(current => ({ ...current, ...patch }))} />
      <SearchControl state={stagedState} update={patch => setDraft(current => ({ ...current, ...patch }))} />
      <div className={s.composerActions}>
        <DialogClose asChild><button className={s.action}>Cancel</button></DialogClose>
        <button className={s.primary} onClick={() => { update(draft); setOpen(false); }}>Apply view</button>
      </div>
    </DialogContent>
  </Dialog>;
}
