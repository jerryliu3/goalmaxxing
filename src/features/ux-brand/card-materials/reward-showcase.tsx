"use client";

import { useState, type CSSProperties } from "react";
import { Rotate3D } from "lucide-react";
import type { CardMaterial } from "./materials";
import { cardOptics, FLAT_POSE, REST_POSE, pointerPose } from "./card-optics";
import { useCardPose } from "./use-card-pose";
import { RewardSculpture, type RewardShape } from "./reward-sculptures";
import styles from "./reward-showcase.module.css";

const REWARDS: { shape: RewardShape; label: string; title: string; milestone: string; detail: string }[] = [
  { shape: "chalice", label: "Annual achievement trophy", title: "A year in motion", milestone: "01 / SUSTAINED MOMENTUM", detail: "A fluted cup, open handles and a weighty stone base. A keepsake for twelve months of showing up." },
  { shape: "medal", label: "Milestone medal", title: "Small steps, made tangible", milestone: "02 / ONE HUNDRED SESSIONS", detail: "A finely reeded rim, stamped numerals and a woven ribbon. Ordinary effort, accumulated into something precious." },
  { shape: "summit", label: "Summit award", title: "Your own summit", milestone: "03 / A LONG-TERM GOAL", detail: "An asymmetric, cut mineral rising from a polished plinth. A personal summit deserves its own silhouette." },
  { shape: "compass", label: "Momentum compass", title: "A way forward", milestone: "04 / BEGINNING AGAIN", detail: "An enamel dial, a jewel bearing and a machined case. A small object for the quiet courage of returning." },
];

function RewardStage({ reward, material, still, color }: { reward: typeof REWARDS[number]; material: CardMaterial; still: boolean; color: string }) {
  const [posed, setPosed] = useState(false);
  const pose = useCardPose(still, posed);
  return <section className={styles.item} aria-label={reward.label}>
    <div className={styles.stage} ref={pose.stage} data-material={material.id} data-still={still}
      style={{ ...cardOptics(still ? FLAT_POSE : REST_POSE), "--material-color": color } as CSSProperties}
      onPointerMove={event => {
        if (still || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pose.moveTo(pointerPose((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height));
      }}
      onPointerLeave={() => { if (!still) pose.reset(); }}
      onPointerCancel={() => { if (!still) pose.reset(); }}
    >
      <span className={styles.editionLabel}>G / OBJECTS OF PROGRESS</span>
      <div className={styles.object}><RewardSculpture shape={reward.shape} /></div>
      <span className={styles.finishLabel}>{material.name} · Study edition</span>
    </div>
    <div className={styles.caption}>
      <div><span>{reward.milestone}</span><h3>{reward.title}</h3></div>
      <button type="button" disabled={still} aria-pressed={posed} aria-label={`Tilt ${reward.label}`} onClick={() => setPosed(value => !value)}><Rotate3D size={15} />{posed ? "Rest" : "Tilt"}</button>
      <p>{reward.detail}</p>
    </div>
  </section>;
}

export function RewardShowcase(props: { material: CardMaterial; still: boolean; color: string }) {
  return <div className={styles.grid}>{REWARDS.map(reward => <RewardStage key={reward.shape} reward={reward} {...props} />)}</div>;
}
