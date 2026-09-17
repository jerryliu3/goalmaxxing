"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, RotateCcw } from "lucide-react";
import { useReducedMotion } from "motion/react";
import materialStyles from "../card-materials/card-materials.module.css";
import { RewardCardPreview } from "./reward-card-preview";
import { getRewardFields, getRewardProgress, REWARD_CONCEPTS, REWARD_MATERIALS, REWARD_SAMPLES, REWARD_TARGETS } from "./reward-model";
import styles from "./reward-study.module.css";
import { MAX_REWARD_PIECES } from "./reward-pieces";

export function RewardStudy() {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [materialId, setMaterialId] = useState("chromatic");
  const [target, setTarget] = useState<number>(REWARD_SAMPLES[0].target);
  const [completed, setCompleted] = useState(0);
  const [reward, setReward] = useState<string>(REWARD_SAMPLES[0].reward);
  const [ink, setInk] = useState(false);
  const [still, setStill] = useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const sample = REWARD_SAMPLES[sampleIndex];
  const material = REWARD_MATERIALS.find(item => item.id === materialId) ?? REWARD_MATERIALS[0];
  const fields = getRewardFields(sample, target);
  const progress = getRewardProgress(completed, target);

  return (
    <main className={`${materialStyles.page} ${styles.page}`} data-backdrop={ink ? "ink" : "paper"}>
      <div className={styles.container}>
        <Link className={styles.back} href="/ux/brand/card-materials"><ArrowLeft size={16} aria-hidden="true" />Card materials</Link>
        <header className={styles.hero}>
          <p>REWARD STUDY</p>
          <h1>Becoming yours.</h1>
          <p>The same material card. Four ways to earn it.</p>
        </header>
        <div className={styles.settings} aria-label="Reward study settings">
          <label>Goal<select value={sampleIndex} onChange={event => {
            const index = Number(event.target.value);
            setSampleIndex(index); setTarget(REWARD_SAMPLES[index].target); setCompleted(0); setReward(REWARD_SAMPLES[index].reward);
          }}>{REWARD_SAMPLES.map((item, index) => <option key={item.id} value={index}>{item.label}</option>)}</select></label>
          <label>Material<select value={material.id} onChange={event => setMaterialId(event.target.value)}>{REWARD_MATERIALS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Reward after<select value={target} onChange={event => { setTarget(Number(event.target.value)); setCompleted(0); }}>
            {REWARD_TARGETS.map(value => <option key={value} value={value}>{value} {sample.unit}</option>)}
          </select></label>
          <label className={styles.rewardInput}>Your reward<input value={reward} maxLength={160} onChange={event => setReward(event.target.value)} /></label>
          <label className={styles.check}><input type="checkbox" checked={ink} onChange={event => setInk(event.target.checked)} />Ink backdrop</label>
          <label className={styles.check}><input type="checkbox" checked={still || reducedMotion} disabled={reducedMotion} onChange={event => setStill(event.target.checked)} />Still mode</label>
        </div>
        {sample.id === "ongoing" && <p className={styles.note}>A successful week meets the card’s weekly target. Weeks accumulate without a streak; earning this reward keeps the goal open.</p>}
        {target > MAX_REWARD_PIECES && <p className={styles.note}>Reassemble groups {target} {sample.unit} into {MAX_REWARD_PIECES} pieces. The final piece arrives with the final completion.</p>}
        <div className={styles.progressControls} aria-label="Simulate progress">
          <p role="status" aria-live="polite">{progress.credited} / {progress.required} {sample.unit}{progress.earned ? " · Reward earned" : ""}</p>
          <div>
            <button type="button" disabled={completed === 0} onClick={() => setCompleted(value => Math.max(0, value - 1))} aria-label="Undo one completion"><Minus size={16} aria-hidden="true" /></button>
            <button type="button" disabled={progress.earned} onClick={() => setCompleted(value => Math.min(target, value + 1))}><Plus size={16} aria-hidden="true" />Complete one</button>
            <button type="button" onClick={() => setCompleted(target - 1)}>Almost earned</button>
            <button type="button" onClick={() => setCompleted(0)}><RotateCcw size={14} aria-hidden="true" />Restart</button>
          </div>
        </div>
        <div className={styles.grid}>
          {REWARD_CONCEPTS.map(concept => <RewardCardPreview key={`${concept.id}-${sample.id}-${target}`} concept={concept}
            material={material} fields={fields} target={target} completed={completed} reward={reward} still={still || reducedMotion} />)}
        </div>
      </div>
    </main>
  );
}
