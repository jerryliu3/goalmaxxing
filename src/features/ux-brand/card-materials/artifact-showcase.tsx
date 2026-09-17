"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Medal, Mountain, Rotate3D, Trophy } from "lucide-react";
import { ApplicationCards } from "./application-cards";
import type { CardMaterial } from "./materials";
import { cardOptics, FLAT_POSE, REST_POSE, pointerPose } from "./card-optics";
import { useCardPose } from "./use-card-pose";
import styles from "./artifact-showcase.module.css";

type ShowcaseMode = "application" | "objects";

function ArtifactStage({
  material,
  still,
  label,
  shape,
  children,
}: {
  material: CardMaterial;
  still: boolean;
  label: string;
  shape: string;
  children: ReactNode;
}) {
  const [posed, setPosed] = useState(false);
  const pose = useCardPose(still, posed);

  return (
    <section className={styles.item} aria-label={label}>
      <div
        ref={pose.stage}
        className={styles.stage}
        data-material={material.id}
        data-shape={shape}
        data-still={still}
        style={cardOptics(still ? FLAT_POSE : REST_POSE) as CSSProperties}
        onPointerMove={(event) => {
          if (still || event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          pose.moveTo(
            pointerPose(
              (event.clientX - rect.left) / rect.width,
              (event.clientY - rect.top) / rect.height,
            ),
          );
        }}
        onPointerLeave={() => {
          if (!still) pose.reset();
        }}
        onPointerCancel={() => {
          if (!still) pose.reset();
        }}
      >
        <div className={styles.aura} aria-hidden="true" />
        <div className={styles.artifact}>{children}</div>
      </div>
      <div className={styles.itemFooter}>
        <span>{label}</span>
        <button
          type="button"
          disabled={still}
          aria-pressed={posed}
          aria-label={`Tilt ${label}`}
          onClick={() => setPosed((value) => !value)}
        >
          <Rotate3D size={15} aria-hidden="true" />
          {posed ? "Rest" : "Tilt"}
        </button>
      </div>
    </section>
  );
}

function TrophyObject() {
  return (
    <div className={`${styles.objectSculpture} ${styles.trophy}`}>
      <div className={styles.trophyGlow} />
      <div className={styles.cup}>
        <span className={styles.handleLeft} />
        <span className={styles.handleRight} />
        <Trophy size={88} strokeWidth={1.05} />
        <strong>12</strong>
      </div>
      <div className={styles.stem} />
      <div className={styles.plinth}><span>YEAR OF MOMENTUM</span><b>2026</b></div>
    </div>
  );
}

function MedalObject() {
  return (
    <div className={`${styles.objectSculpture} ${styles.medal}`}>
      <div className={styles.ribbon}><i /><i /></div>
      <div className={styles.medalEdge} />
      <div className={styles.medalFace}>
        <Medal size={42} strokeWidth={1.15} />
        <strong>100</strong>
        <span>MILESTONES</span>
      </div>
    </div>
  );
}

function TotemObject() {
  return (
    <div className={`${styles.objectSculpture} ${styles.totem}`}>
      <div className={styles.compassRing}>
        <span>N</span><span>E</span><span>S</span><span>W</span>
        <Mountain size={72} strokeWidth={1.05} />
        <i />
      </div>
      <div className={styles.totemBase}>
        <strong>KEEP<br />GOING</strong>
        <span>84% RHYTHM</span>
      </div>
    </div>
  );
}

export function ArtifactShowcase({
  mode,
  material,
  still,
  color,
}: {
  color: string;
  mode: ShowcaseMode;
  material: CardMaterial;
  still: boolean;
}) {
  if (mode === "application") return <ApplicationCards material={material} still={still} color={color} />;

  return (
    <div className={styles.grid}>
      <ArtifactStage material={material} still={still} label="Annual achievement trophy" shape="trophy"><TrophyObject /></ArtifactStage>
      <ArtifactStage material={material} still={still} label="Milestone medal" shape="medal"><MedalObject /></ArtifactStage>
      <ArtifactStage material={material} still={still} label="Momentum compass" shape="totem"><TotemObject /></ArtifactStage>
    </div>
  );
}
