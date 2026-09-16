"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Rotate3D } from "lucide-react";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import { MATERIALS, MATERIAL_SAMPLES, type CardMaterial } from "./materials";
import styles from "./card-materials.module.css";

function MaterialPreview({ material, fields, still, history }: {
  material: CardMaterial; fields: GoalCreationFields; still: boolean; history: boolean;
}) {
  const [posed, setPosed] = useState(false);
  const spatial = material.form !== "flat";
  return (
    <section className={styles.concept} id={material.id} aria-labelledby={`${material.id}-title`}>
      <header className={styles.conceptHeader}>
        <span>{material.tag}</span>
        <h2 id={`${material.id}-title`}>{material.name}</h2>
        <p>{material.premise}</p>
      </header>
      <div className={styles.stage} data-material={material.id} data-form={material.form} data-still={still} data-posed={posed}
        style={{ "--material-color": fields.color } as CSSProperties}
        onPointerMove={event => {
          if (still || !spatial || event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          event.currentTarget.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
          event.currentTarget.style.setProperty("--ry", `${(x - 0.5) * 22}deg`);
          event.currentTarget.style.setProperty("--light-x", `${x * 100}%`);
          event.currentTarget.style.setProperty("--light-y", `${y * 100}%`);
        }}
        onPointerLeave={event => {
          for (const property of ["--rx", "--ry", "--light-x", "--light-y"]) event.currentTarget.style.removeProperty(property);
        }}
      >
        <div className={styles.atmosphere} aria-hidden="true" />
        <div className={styles.object}>
          {material.form === "layered" && <>
            <span className={styles.backplate} aria-hidden="true" />
            <span className={styles.middleLayer} aria-hidden="true" />
          </>}
          <TempoGoalCard fields={fields} context={history ? "history" : "creation"} achieved={history} />
        </div>
      </div>
      <div className={styles.interaction}>
        <span>{spatial ? "Move your pointer to explore the depth." : "Material and light, with a still silhouette."}</span>
        {spatial && <button type="button" disabled={still} aria-pressed={posed} onClick={() => setPosed(value => !value)} aria-label={`Tilt ${material.name}`}><Rotate3D size={16} aria-hidden="true" />{posed ? "Rest" : "Tilt"}</button>}
      </div>
      <div className={styles.notes}>
        <p>{material.detail}</p>
        <dl><div><dt>Best home</dt><dd>{material.use}</dd></div><div><dt>Tradeoff</dt><dd>{material.tradeoff}</dd></div></dl>
      </div>
    </section>
  );
}

export function CardMaterialsStudy() {
  const [sample, setSample] = useState(0);
  const [dark, setDark] = useState(false);
  const [still, setStill] = useState(false);
  const [history, setHistory] = useState(false);
  const reducedMotion = useReducedMotion();
  return (
    <main className={styles.page} data-backdrop={dark ? "ink" : "paper"}>
      <div className={styles.container}>
        <Link className={styles.back} href="/ux/brand"><ArrowLeft size={15} />Visual language gallery</Link>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>MATERIAL STUDY / FIVE DIRECTIONS</p>
          <h1>Something you<br /><em>want to hold.</em></h1>
          <p>The same goal card, through five different materials. Four explore physical depth; Woven Paper explores the beauty of a quiet surface.</p>
          <nav aria-label="Card materials">{MATERIALS.map(material => <a key={material.id} href={`#${material.id}`}>{material.name}<ArrowUpRight size={13} /></a>)}</nav>
        </header>
        <div className={styles.controls} aria-label="Comparison controls">
          <label>Sample goal<select value={sample} onChange={event => setSample(Number(event.target.value))}>{MATERIAL_SAMPLES.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></label>
          <label><input type="checkbox" checked={history} onChange={event => setHistory(event.target.checked)} />Completed goal</label>
          <label><input type="checkbox" checked={dark} onChange={event => setDark(event.target.checked)} />Ink backdrop</label>
          <label><input type="checkbox" checked={still || Boolean(reducedMotion)} disabled={Boolean(reducedMotion)} onChange={event => setStill(event.target.checked)} />Still mode</label>
        </div>
        <div className={styles.grid}>{MATERIALS.map(material => <MaterialPreview key={material.id} material={material} fields={MATERIAL_SAMPLES[sample].fields} still={still || Boolean(reducedMotion)} history={history} />)}</div>
        <aside className={styles.recommendation}>
          <p className={styles.eyebrow}>A DIRECTION TO START WITH</p>
          <h2>Ceramic for the everyday.<br />Glass for the spotlight.</h2>
          <p>Ceramic Relief keeps the existing category colors and clear type while adding weight and a satisfying edge. Liquid Glass is a richer alternative for a single featured card. Woven Paper is the quietest fit for the folio. These are explorations; choosing a material is the next step.</p>
          <Link href="/demo/insights/folios">Try the folio opening <ArrowUpRight size={15} /></Link>
        </aside>
        <footer className={styles.footer}>Goalmaxxing · Card materials study · Uses the shared Tempo goal card</footer>
      </div>
    </main>
  );
}
