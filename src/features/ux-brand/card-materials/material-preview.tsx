"use client";

import { type CSSProperties } from "react";
import { Rotate3D } from "lucide-react";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import type { CardMaterial } from "./materials";
import { CardSolidBody } from "./card-solid-body";
import { cardOptics, FLAT_POSE, REST_POSE } from "./card-optics";
import { useCardRotation } from "./use-card-rotation";
import styles from "./card-materials.module.css";
import categoryStyles from "./category-materials.module.css";
import "./card-emboss.css";

export function MaterialPreview({ material, fields, still, history }: {
  material: CardMaterial; fields: GoalCreationFields; still: boolean; history: boolean;
}) {
  const spatial = material.form !== "flat";
  const solid = material.form === "solid";
  const rotation = useCardRotation(still || !spatial, solid);
  return (
    <section className={styles.concept} id={material.id} aria-labelledby={`${material.id}-title`}>
      <header className={styles.conceptHeader}>
        <span>{material.tag}</span>
        <h2 id={`${material.id}-title`}>{material.name}</h2>
        <p>{material.premise}</p>
      </header>
      <div ref={rotation.stage} className={`${styles.stage} ${categoryStyles.stage}`} data-emboss-scope="" data-material={material.id} data-form={material.form} data-still={still} data-inspecting={rotation.inspecting}
        style={{ ...cardOptics(still || !spatial ? FLAT_POSE : REST_POSE), "--material-color": fields.color } as CSSProperties}
        {...rotation.stageHandlers}
      >
        <div className={styles.atmosphere} aria-hidden="true" />
        <div className={styles.object} data-card-object=""
          role={solid ? "group" : undefined}
          aria-label={solid ? `${material.name} card rotation` : undefined}
          aria-describedby={solid ? `${material.id}-rotation-hint` : undefined}
          tabIndex={solid && !still ? 0 : undefined}
          {...rotation.cardHandlers}
        >
          {material.form === "solid" && <CardSolidBody />}
          {material.form === "layered" && <>
            <span className={styles.backplate} aria-hidden="true" />
            <span className={styles.middleLayer} aria-hidden="true" />
          </>}
          <TempoGoalCard fields={fields} context={history ? "history" : "creation"} achieved={history} />
        </div>
      </div>
      <div className={styles.interaction}>
        <span id={`${material.id}-rotation-hint`}>{solid ? "Hover to tilt. Drag to turn. Arrows rotate; Enter flips; Home resets." : spatial ? "Move your pointer to explore the depth." : "Material and light, with a still silhouette."}</span>
        {spatial && <div className={styles.rotationButtons}>
          <button type="button" disabled={still} aria-pressed={rotation.posed} onClick={rotation.togglePose} aria-label={`Tilt ${material.name}`}><Rotate3D size={16} aria-hidden="true" />{rotation.posed ? "Rest" : "Tilt"}</button>
          {solid && <button type="button" disabled={still} onClick={rotation.reset} aria-label={`Reset ${material.name}`}>Reset</button>}
        </div>}
      </div>
      <div className={styles.notes}>
        <p>{material.detail}</p>
        <dl><div><dt>Best home</dt><dd>{material.use}</dd></div><div><dt>Tradeoff</dt><dd>{material.tradeoff}</dd></div></dl>
      </div>
    </section>
  );
}

