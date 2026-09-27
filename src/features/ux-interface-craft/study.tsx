"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Columns2, RotateCcw, Smartphone } from "lucide-react";
import { concepts, surfaces, initialState, type Concept, type Surface, type StudyState } from "./model";
import { PlannerConcept } from "./planner";
import { HistoryConcept } from "./history";
import { GoalsConcept } from "./goals";
import { ProgressConcept } from "./progress";
import s from "./study.module.css";

const renderers = { planner: PlannerConcept, history: HistoryConcept, goals: GoalsConcept, progress: ProgressConcept };

export function InterfaceCraftStudy() {
  const [concept, setConcept] = useState<Concept>("contour");
  const [surface, setSurface] = useState<Surface>("planner");
  const [compare, setCompare] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [state, setState] = useState(initialState);
  const [picks, setPicks] = useState<Partial<Record<Surface, Concept>>>({});
  const update = (patch: Partial<StudyState>) => setState(current => ({ ...current, ...patch }));
  const selectedSurface = surfaces.find(item => item.id === surface)!;
  const Renderer = renderers[surface];
  return <main className={s.study}>
    <header className={s.studyHeader}><Link href="/ux"><ArrowLeft size={15} />UX labs</Link><span>EXPLORATION  /  2026.09</span><span>Interactive sample data</span></header>
    <div className={s.intro}><p className={s.kicker}>THE EVERYDAY INTERFACE</p><h1>Small things.<br /><em>Considered deeply.</em></h1><p>Three fresh directions for the controls, history, and details you touch every day. Compare the same moments through a different design lens.</p></div>
    <div className={s.conceptPicker} role="group" aria-label="Design direction">{concepts.map(item => <button key={item.id} data-concept={item.id} aria-pressed={concept === item.id} onClick={() => { setConcept(item.id); setCompare(false); }}><span className={s.conceptSwatch}><i /><i /><i /></span><small>{item.number}</small><strong>{item.name}</strong><span>{item.premise}</span>{concept === item.id && !compare && <Check className={s.conceptCheck} size={18} />}</button>)}</div>
    <section className={s.workbench} aria-label="Concept workbench">
      <div className={s.studyTools}><div className={s.surfacePicker} role="group" aria-label="Study surface">{surfaces.map((item, index) => <button key={item.id} aria-pressed={surface === item.id} onClick={() => setSurface(item.id)}><small>0{index + 1}</small>{item.name}</button>)}</div><div className={s.utilityTools}><button aria-pressed={compare} onClick={() => setCompare(value => !value)}><Columns2 size={15} />Compare</button><button aria-pressed={narrow} onClick={() => setNarrow(value => !value)}><Smartphone size={15} />Narrow</button><button onClick={() => setState(initialState())}><RotateCcw size={15} />Reset sample</button></div></div>
      <div className={s.studyPrompt}><p>{selectedSurface.prompt}</p><span>{compare ? "Interactions are synchronized across all three." : "Sample changes carry across concepts and surfaces."}</span></div>
      <div className={s.stages} data-compare={compare} data-narrow={narrow}>
        {(compare ? concepts : concepts.filter(item => item.id === concept)).map(item => <section key={item.id} className={s.conceptStage} aria-label={`${item.name} ${selectedSurface.name}`}>
          <div className={s.stageLabel}><span>{item.number} / <strong>{item.name}</strong></span><button aria-pressed={picks[surface] === item.id} onClick={() => setPicks(current => ({ ...current, [surface]: current[surface] === item.id ? undefined : item.id }))}>{picks[surface] === item.id ? <><Check size={14} />Preferred</> : "Prefer this"}</button></div>
          <div className={s.previewContainer}><div className={s.preview} data-concept={item.id}><Renderer concept={item.id} state={state} update={update} /></div></div>
          <div className={s.conceptNote}><p>{item.description}</p><p><strong>Tradeoff</strong> {item.tradeoff}</p></div>
        </section>)}
      </div>
      <footer className={s.studyFooter}><div><p className={s.kicker}>THE COMPARISON</p><h2>{selectedSurface.question}</h2><p>Pick a favorite independently for each surface. A final direction can combine them.</p></div><div className={s.picks} aria-live="polite">{surfaces.map(item => <p key={item.id}><span>{item.name}</span><strong>{concepts.find(direction => direction.id === picks[item.id])?.name ?? "Undecided"}</strong></p>)}</div></footer>
    </section>
    <p className={s.endNote}>UX study only · Preferences last for this visit · Sample clock: September 27, 2026</p>
  </main>;
}
