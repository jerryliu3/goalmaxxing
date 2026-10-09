"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { Rotate3D } from "lucide-react";
import { resolveMaterialColor, type CardMaterial } from "./materials";
import { CardSolidBody } from "@/features/goals/card-material/card-solid-body";
import { cardOptics, FLAT_POSE, REST_POSE } from "@/features/goals/card-material/card-optics";
import { useCardRotation } from "@/features/goals/card-material/use-card-rotation";
import styles from "./card-materials.module.css";
import categoryStyles from "./category-materials.module.css";
import darkStyles from "./dark-materials.module.css";

/** The same body, finish and interaction for every card format in the study. */
export function MaterialStage({ material, color, still, label = material.name, layout = "portrait", embedded = false, controls = true, children }: {
  material: CardMaterial; color: string; still: boolean; label?: string;
  layout?: "portrait" | "landscape"; embedded?: boolean; controls?: boolean; children: ReactNode;
}) {
  const hintId = useId();
  const materialColor = resolveMaterialColor(material, color);
  const spatial = material.form !== "flat";
  const solid = material.form === "solid";
  const rotation = useCardRotation(still || !spatial, solid);
  return <>
      <div ref={rotation.stage} className={`${styles.stage} ${categoryStyles.stage} ${darkStyles.stage}`} data-material={material.id} data-color-mode={"colorMode" in material ? material.colorMode : undefined} data-layout={layout} data-form={material.form} data-still={still} data-embedded={embedded || undefined} data-inspecting={rotation.inspecting}
        style={{ ...cardOptics(still || !spatial ? FLAT_POSE : REST_POSE), "--material-color": materialColor, "--goal-color": materialColor } as CSSProperties}
        {...rotation.stageHandlers}
      >
        <div className={styles.atmosphere} aria-hidden="true" />
        <div className={styles.object} data-card-object=""
          role={solid ? "group" : undefined}
          aria-label={solid ? `${label} rotation` : undefined}
          aria-describedby={solid ? hintId : undefined}
          tabIndex={solid && !still ? 0 : undefined}
          draggable={false}
          {...rotation.cardHandlers}
        >
          {material.form === "solid" && <CardSolidBody />}
          {material.form === "layered" && <>
            <span className={styles.backplate} aria-hidden="true" />
            <span className={styles.middleLayer} aria-hidden="true" />
          </>}
          <div className="tempo-card" data-material-surface="" aria-hidden="true" />
          {children}
        </div>
      </div>
      {controls ? <div className={styles.interaction}>
        <span id={hintId}>{solid ? "Hover to tilt. Drag to turn. Arrows rotate; Enter flips; Home resets." : spatial ? "Move your pointer to explore the depth." : "Material and light, with a still silhouette."}</span>
        {spatial && <div className={styles.rotationButtons}>
          <button type="button" disabled={still} aria-pressed={rotation.posed} onClick={rotation.togglePose} aria-label={`Tilt ${label}`}><Rotate3D size={16} aria-hidden="true" />{rotation.posed ? "Rest" : "Tilt"}</button>
          {solid && <button type="button" disabled={still} onClick={rotation.reset} aria-label={`Reset ${label}`}>Reset</button>}
        </div>}
      </div> : <span id={hintId} className="sr-only">{solid ? "Hover to tilt. Drag to turn." : null}</span>}
  </>;
}
