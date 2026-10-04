"use client";

import { useState, type CSSProperties } from "react";
import { Rotate3D } from "lucide-react";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import { cardOptics, FLAT_POSE, REST_POSE, pointerPose } from "@/features/goals/card-material/card-optics";
import type { CardMaterial } from "../card-materials/materials";
import { useCardPose } from "@/features/goals/card-material/use-card-pose";
import materialStyles from "../card-materials/card-materials.module.css";
import categoryStyles from "../card-materials/category-materials.module.css";
import { RewardCardFace } from "./reward-card-face";
import { ReassemblingCard } from "./reassembling-card";
import { getRewardFilter, getRewardProgress, type RewardConcept } from "./reward-model";
import styles from "./reward-study.module.css";

export function RewardCardPreview({ concept, material, fields, completed, target, reward, still }: {
  concept: RewardConcept;
  material: CardMaterial;
  fields: GoalCreationFields;
  completed: number;
  target: number;
  reward: string;
  still: boolean;
}) {
  const [posed, setPosed] = useState(false);
  const pose = useCardPose(still, posed);
  const progress = getRewardProgress(completed, target);
  return (
    <section className={styles.concept} aria-labelledby={`${concept.id}-title`}>
      <header className={styles.conceptHeader}>
        <h2 id={`${concept.id}-title`}>{concept.name}</h2>
        <p>{concept.description}</p>
      </header>
      <div ref={pose.stage} className={`${materialStyles.stage} ${categoryStyles.stage} ${styles.stage}`}
        data-material={material.id} data-form={material.form} data-still={still}
        style={{ ...cardOptics(still ? FLAT_POSE : REST_POSE), "--material-color": fields.color } as CSSProperties}
        onPointerMove={event => {
          if (still || event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          pose.moveTo(pointerPose((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height));
        }}
        onPointerLeave={() => { if (!still) pose.reset(); }}
        onPointerCancel={() => { if (!still) pose.reset(); }}
      >
        <div className={styles.artwork} data-reward-treatment={concept.id}
          style={{ "--reward-filter": getRewardFilter(concept.id, progress.fraction) } as CSSProperties}>
          <div className={materialStyles.object} data-card-object="">
            {concept.id === "reassemble"
              ? <ReassemblingCard fields={fields} completed={completed} target={target} still={still} />
              : <RewardCardFace fields={fields} earned={progress.earned} />}
          </div>
        </div>
      </div>
      <div className={styles.caption}>
        <p data-earned={progress.earned}>
          <span>{progress.earned ? "Earned" : "Reward"}</span>
          {reward.trim() || "Something to look forward to"}
        </p>
        <button type="button" onClick={() => setPosed(value => !value)} disabled={still}
          aria-pressed={posed} aria-label={`Tilt ${concept.name}`}>
          <Rotate3D size={15} aria-hidden="true" />{posed ? "Rest" : "Tilt"}
        </button>
      </div>
    </section>
  );
}
