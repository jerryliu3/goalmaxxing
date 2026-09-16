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
          <p className={styles.eyebrow}>MATERIAL STUDY / TWELVE DIRECTIONS</p>
          <h1>Something you<br /><em>want to hold.</em></h1>
          <p>Twelve materials, one goal card. Prismatic Pearl, Chromatic Foil, and Anodized Alloy now take their colors from your goal. Switch the sample, then tilt or drag to explore the light.</p>
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
          <h2>Your category.<br />Its own kind of precious.</h2>
          <p>Prismatic Pearl brings a soft category-colored glow to a light shell. Chromatic Foil is the darker collectible, and Anodized Alloy wears the color throughout its metal. The original Pearl and Foil remain here for comparison.</p>
          <Link href="/demo/insights/folios">Try the folio opening <ArrowUpRight size={15} /></Link>
        </aside>
        <footer className={styles.footer}>Goalmaxxing · Card materials study · Uses the shared Tempo goal card</footer>
      </div>
    </main>
  );
}
