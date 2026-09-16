"use client";

import { useState, type CSSProperties } from "react";
import { Rotate3D } from "lucide-react";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import type { CardMaterial } from "./materials";
import { CardSolidBody } from "./card-solid-body";
import { cardOptics, FLAT_POSE, REST_POSE, pointerPose } from "./card-optics";
import { useCardPose } from "./use-card-pose";
import styles from "./card-materials.module.css";

export function MaterialPreview({ material, fields, still, history }: {
  material: CardMaterial; fields: GoalCreationFields; still: boolean; history: boolean;
}) {
  const [posed, setPosed] = useState(false);
  const spatial = material.form !== "flat";
  const pose = useCardPose(still || !spatial, posed);
  return (
    <section className={styles.concept} id={material.id} aria-labelledby={`${material.id}-title`}>
      <header className={styles.conceptHeader}>
        <span>{material.tag}</span>
        <h2 id={`${material.id}-title`}>{material.name}</h2>
        <p>{material.premise}</p>
      </header>
      <div ref={pose.stage} className={styles.stage} data-material={material.id} data-form={material.form} data-still={still} data-posed={posed}
        style={{ ...cardOptics(still || !spatial ? FLAT_POSE : REST_POSE), "--material-color": fields.color } as CSSProperties}
        onPointerMove={event => {
          if (still || !spatial || event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          pose.moveTo(pointerPose(x, y));
        }}
        onPointerLeave={() => { if (!still && spatial) pose.reset(); }}
        onPointerCancel={() => { if (!still && spatial) pose.reset(); }}
      >
        <div className={styles.atmosphere} aria-hidden="true" />
        <div className={styles.object}>
          {material.form === "solid" && <CardSolidBody />}
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

