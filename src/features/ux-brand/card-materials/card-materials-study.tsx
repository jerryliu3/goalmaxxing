"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { MATERIALS, MATERIAL_SAMPLES } from "./materials";
import { LetteringFilters } from "./lettering-filters";
import { MaterialPreview } from "./material-preview";
import { ApplicationCards } from "./application-cards";
import { RewardShowcase } from "./reward-showcase";
import styles from "./card-materials.module.css";

type StudyView = "cards" | "application" | "objects";

export function CardMaterialsStudy({ share = false }: { share?: boolean }) {
  const [lettering, setLettering] = useState("raised");
  const [textDepth, setTextDepth] = useState(6);
  const letteringId = `lettering-${useId().replace(/:/g, "")}`;
  const [sample, setSample] = useState(0);
  const [material, setMaterial] = useState(5);
  const [view, setView] = useState<StudyView>("cards");
  const [dark, setDark] = useState(false);
  const [still, setStill] = useState(false);
  const [history, setHistory] = useState(false);
  const reducedMotion = useReducedMotion();
  const motionStopped = still || Boolean(reducedMotion);
  return (
    <main className={styles.page} data-backdrop={dark ? "ink" : "paper"} data-lettering={lettering}
      style={{
        "--raised-text-depth": `${textDepth}px`,
        "--letter-relief": lettering === "flat" || (lettering === "raised" && view !== "objects") ? "none" : `url("#${letteringId}-${lettering}-text")`,
        "--letter-relief-display": lettering === "flat" || (lettering === "raised" && view !== "objects") ? "none" : `url("#${letteringId}-${lettering}-display")`,
      } as CSSProperties}>
      <LetteringFilters id={letteringId} />
      <div className={styles.container}>
        {!share && <Link className={styles.back} href="/ux/brand"><ArrowLeft size={15} />Visual language gallery</Link>}
        <header className={styles.hero}>
          <p className={styles.eyebrow}>MATERIAL STUDY / CARDS & OBJECTS</p>
          <h1>Something you<br /><em>want to hold.</em></h1>
          <p>Twelve material directions, now extended into a system. Explore goal-responsive finishes, application formats cut from the same materials, and sculptural rewards that turn progress into an object.</p>
          {!share && <Link className={styles.back} href="/ux/brand/card-rewards">Explore reward transformations <ArrowUpRight size={15} aria-hidden="true" /></Link>}
          {view === "cards" && <nav aria-label="Card materials">{MATERIALS.map(item => <a key={item.id} href={`#${item.id}`}>{item.name}<ArrowUpRight size={13} /></a>)}</nav>}
        </header>
        <div className={styles.tabs} role="tablist" aria-label="Material study views">
          <button type="button" role="tab" aria-selected={view === "cards"} onClick={() => setView("cards")}><span>01</span> Goal cards</button>
          <button type="button" role="tab" aria-selected={view === "application"} onClick={() => setView("application")}><span>02</span> In the app</button>
          <button type="button" role="tab" aria-selected={view === "objects"} onClick={() => setView("objects")}><span>03</span> Trophies & objects</button>
        </div>
        <div className={styles.controls} aria-label="Comparison controls">
          {view === "cards" ? <>
            <label>Sample goal<select value={sample} onChange={event => setSample(Number(event.target.value))}>{MATERIAL_SAMPLES.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></label>
            <label><input type="checkbox" checked={history} onChange={event => setHistory(event.target.checked)} />Completed goal</label>
          </> : <label>Material<select value={material} onChange={event => setMaterial(Number(event.target.value))}>{MATERIALS.map((item, index) => <option key={item.id} value={index}>{item.name}</option>)}</select></label>}
          {view !== "cards" && <label>Category color<select value={sample} onChange={event => setSample(Number(event.target.value))}>{MATERIAL_SAMPLES.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></label>}
          <label>Lettering<select value={lettering} onChange={event => setLettering(event.target.value)}><option value="raised">Embossed</option><option value="recessed">Engraved</option><option value="flat">Printed</option></select></label>
          {view !== "objects" && <label>Text depth<select value={textDepth} disabled={lettering !== "raised"} onChange={event => setTextDepth(Number(event.target.value))}><option value={2}>Fine · 2px</option><option value={4}>Sculpted · 4px</option><option value={6}>Raised · 6px</option><option value={8}>Bold · 8px</option><option value={10}>Deep · 10px</option><option value={12}>Extreme · 12px</option></select></label>}
          <label><input type="checkbox" checked={dark} onChange={event => setDark(event.target.checked)} />Ink backdrop</label>
          <label><input type="checkbox" checked={motionStopped} disabled={Boolean(reducedMotion)} onChange={event => setStill(event.target.checked)} />Still mode</label>
          {view !== "objects" && <p className={styles.letteringHint}>Embossed letters share one extrusion height on the number, period, and title. Tilt or drag a card to see their sides; choose Printed to remove the thickness. Category stays flat. Engraved compares surface shading.</p>}
        </div>
        {view === "cards" ? <div className={styles.grid}>{MATERIALS.map(item => <MaterialPreview key={item.id} material={item} fields={MATERIAL_SAMPLES[sample].fields} still={motionStopped} history={history} />)}</div> : <>
          <div className={styles.viewIntro}>
            <p className={styles.eyebrow}>{view === "application" ? "THE MATERIAL SYSTEM, APPLIED" : "PROGRESS WITH MASS"}</p>
            <h2>{view === "application" ? "One finish. Four ways to belong." : "Not a card. A thing earned."}</h2>
            <p>{view === "application" ? "A challenge to join. A place in the league. An identity to keep. A membership shared with your people. Sample cards, all cut from the same material." : "Four collectible reward concepts: a fluted chalice, a machined medallion, a faceted summit, and a precision compass. Different silhouettes, with the same family of finishes and responsive light."}</p>
          </div>
          {view === "application"
            ? <ApplicationCards material={MATERIALS[material]} still={motionStopped} color={MATERIAL_SAMPLES[sample].fields.color} />
            : <RewardShowcase material={MATERIALS[material]} still={motionStopped} color={MATERIAL_SAMPLES[sample].fields.color} />}
        </>}
        <aside className={styles.recommendation}>
          <p className={styles.eyebrow}>THE PREMIUM EDIT</p>
          <h2>One material language.<br />More than one kind of reward.</h2>
          <p>Prismatic Pearl, Chromatic Foil, and Anodized Alloy carry category color through light, foil, or metal. Embossed card lettering rises from the surface, with a material face and closely spaced depth layers. Thickness follows the same perspective as the card. Compare depths from 2px to 12px, engraved surface shading, and printed type. Only the number, period, and title rise; category stays printed. Lettering sits against the material, like a finely stamped membership card. The application and object studies test how far that language can stretch.</p>
          <Link href="/demo/insights/folios">Try the folio opening <ArrowUpRight size={15} /></Link>
        </aside>
        <footer className={styles.footer}>Goalmaxxing · Material system study · Cards, identity, and earned objects</footer>
      </div>
    </main>
  );
}
