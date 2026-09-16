"use client";

import Link from "next/link";
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { MATERIALS, MATERIAL_SAMPLES } from "./materials";
import { MaterialPreview } from "./material-preview";
import styles from "./card-materials.module.css";

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
          <p className={styles.eyebrow}>MATERIAL STUDY / EIGHT DIRECTIONS</p>
          <h1>Something you<br /><em>want to hold.</em></h1>
          <p>The same goal card, through eight different materials. Refined glass, ceramic, and foil meet three new collectible finishes: pearl, engraved enamel, and leather with gold.</p>
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
          <p className={styles.eyebrow}>THE PREMIUM EDIT</p>
          <h2>Foil, with more to hold.<br />Three new ways to shine.</h2>
          <p>Foil Print keeps its iridescent ink and gains a solid gilded edge. Pearl Reserve brings the same sense of occasion to a light card; Midnight Guilloché adds precision, and Oxblood Atelier adds warmth. Each uses the same goal content, so the choice comes down to what you want to hold.</p>
          <Link href="/demo/insights/folios">Try the folio opening <ArrowUpRight size={15} /></Link>
        </aside>
        <footer className={styles.footer}>Goalmaxxing · Card materials study · Uses the shared Tempo goal card</footer>
      </div>
    </main>
  );
}
