import { Check } from "lucide-react";
import { PlannerConcept } from "../planner";
import type { StudyState } from "../model";
import { plannerConcepts, type PlannerVariant } from "./concepts";
import base from "../study.module.css";
import s from "./planner.module.css";

export function PlannerExploration({ variant, onVariantChange, compare, narrow, state, update, pick, onPick, resetVersion }: {
  variant: PlannerVariant;
  onVariantChange: (variant: PlannerVariant) => void;
  compare: boolean;
  narrow: boolean;
  state: StudyState;
  update: (patch: Partial<StudyState>) => void;
  pick?: string;
  onPick: (variant: PlannerVariant) => void;
  resetVersion: number;
}) {
  return <>
    <div className={s.roundIntro}><p>ROUND 02 / INTERACTION MODELS</p><h2>Four ways to operate the same planner.</h2><span>Same styling. Same work. Different entry points, control visibility, and commitment steps.</span></div>
    <div className={s.variantPicker} role="group" aria-label="Planner interaction model">
      {plannerConcepts.map(item => <button key={item.id} aria-pressed={!compare && item.id === variant} onClick={() => onVariantChange(item.id)}>
        <span className={s.layoutSketch} data-layout={item.id} aria-hidden="true"><i /><i /><i /><i /></span>
        <small>{item.number}</small><strong>{item.name}</strong><span>{item.premise}</span>
      </button>)}
    </div>
    <div className={s.plannerStages} data-compare={compare} data-narrow={narrow}>
      {(compare ? plannerConcepts : plannerConcepts.filter(item => item.id === variant)).map(item => <section key={item.id} className={base.conceptStage} aria-label={`${item.name} Planner controls`}>
        <div className={base.stageLabel}><span>{item.number} / <strong>{item.name}</strong></span><button aria-pressed={pick === item.id} onClick={() => onPick(item.id)}>{pick === item.id ? <><Check size={14} />Preferred</> : "Prefer this"}</button></div>
        <p className={s.tryTask}><strong>Try it</strong> {item.task}</p>
        <div className={base.previewContainer}><div className={base.preview} data-concept="contour">
          <PlannerConcept key={resetVersion} variant={item.id} state={state} update={update} />
        </div></div>
        <div className={base.conceptNote}><p>{item.description}</p><p><strong>Tradeoff</strong> {item.tradeoff}</p></div>
      </section>)}
    </div>
  </>;
}
