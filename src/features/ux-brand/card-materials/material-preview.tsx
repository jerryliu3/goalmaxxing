"use client";

import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import type { CardMaterial } from "./materials";
import { renderSolidLettering } from "./solid-lettering";
import { MaterialStage } from "./material-stage";
import styles from "./card-materials.module.css";

export function MaterialPreview({ material, fields, still, history }: {
  material: CardMaterial; fields: GoalCreationFields; still: boolean; history: boolean;
}) {
  return (
    <section className={styles.concept} id={material.id} aria-labelledby={`${material.id}-title`}>
      <header className={styles.conceptHeader}>
        <span>{material.tag}</span>
        <h2 id={`${material.id}-title`}>{material.name}</h2>
        <p>{material.premise}</p>
      </header>
      <MaterialStage material={material} color={fields.color} still={still}>
        <TempoGoalCard fields={fields} context={history ? "history" : "creation"} achieved={history} renderLettering={renderSolidLettering} />
      </MaterialStage>
      <div className={styles.notes}>
        <p>{material.detail}</p>
        <dl><div><dt>Best home</dt><dd>{material.use}</dd></div><div><dt>Tradeoff</dt><dd>{material.tradeoff}</dd></div></dl>
      </div>
    </section>
  );
}

