"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Award,
  ChevronUp,
  Crown,
  Flame,
  Footprints,
  Medal,
  Mountain,
  Rotate3D,
  Sparkles,
  Trophy,
} from "lucide-react";
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

function ChallengeCard() {
  return (
    <article className={`${styles.materialFace} ${styles.challengeCard}`}>
      <div className={styles.faceSheen} aria-hidden="true" />
      <div className={styles.metaRow}>
        <span>COMMUNITY CHALLENGE</span>
        <Flame size={20} />
      </div>
      <div className={styles.challengeMark}>
        <Mountain size={44} strokeWidth={1.35} />
        <strong>30</strong>
        <span>DAYS</span>
      </div>
      <h2>Sunrise club</h2>
      <p>Move before 8am. Build a month that starts on purpose.</p>
      <div className={styles.progress} aria-label="18 of 30 days complete">
        <i style={{ width: "60%" }} />
      </div>
      <div className={styles.metaRow}>
        <span>18 / 30 complete</span>
        <span>1,284 climbing</span>
      </div>
    </article>
  );
}

function LeaderboardCard() {
  return (
    <article className={`${styles.materialFace} ${styles.leaderboardCard}`}>
      <div className={styles.faceSheen} aria-hidden="true" />
      <div className={styles.leaderHeading}>
        <div>
          <span>SEPTEMBER LEAGUE</span>
          <h2>Trailblazers</h2>
        </div>
        <Crown size={28} />
      </div>
      <ol>
        <li><b>01</b><span className={styles.miniPortrait}>MK</span><span><strong>Maya K.</strong><small>42 wins</small></span><em>980</em></li>
        <li><b>02</b><span className={styles.miniPortrait}>JL</span><span><strong>Jordan L.</strong><small>38 wins</small></span><em>920</em></li>
        <li data-self="true"><b>03</b><span className={styles.miniPortrait}>YO</span><span><strong>You</strong><small>36 wins</small></span><em>875</em></li>
      </ol>
      <p className={styles.leaderNote}><ChevronUp size={14} /> 24 points to second place</p>
    </article>
  );
}

function ProfileCard() {
  return (
    <article className={`${styles.materialFace} ${styles.profileCard}`}>
      <div className={styles.faceSheen} aria-hidden="true" />
      <div className={styles.profileTop}>
        <span>MEMBER / 2026</span>
        <Sparkles size={19} />
      </div>
      <div className={styles.portrait} role="img" aria-label="Stylized profile portrait of Alex">
        <div className={styles.sun} />
        <div className={styles.ridgeBack} />
        <div className={styles.ridgeFront} />
        <div className={styles.person}><i /><b /></div>
      </div>
      <div className={styles.profileIdentity}>
        <div><h2>Alex Morgan</h2><p>Building a life with more open sky.</p></div>
        <strong>LV. 18</strong>
      </div>
      <div className={styles.profileStats}>
        <span><b>12</b> goals</span>
        <span><b>84%</b> rhythm</span>
        <span><b>146</b> days</span>
      </div>
      <div className={styles.badges}>
        <span><Footprints size={14} /> First 100</span>
        <span><Mountain size={14} /> High point</span>
        <span><Award size={14} /> Year one</span>
      </div>
    </article>
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
}: {
  mode: ShowcaseMode;
  material: CardMaterial;
  still: boolean;
}) {
  if (mode === "application") {
    return (
      <div className={styles.grid}>
        <ArtifactStage material={material} still={still} label="Challenge card" shape="challenge"><ChallengeCard /></ArtifactStage>
        <ArtifactStage material={material} still={still} label="Leaderboard card" shape="leaderboard"><LeaderboardCard /></ArtifactStage>
        <ArtifactStage material={material} still={still} label="Profile trading card" shape="profile"><ProfileCard /></ArtifactStage>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      <ArtifactStage material={material} still={still} label="Annual achievement trophy" shape="trophy"><TrophyObject /></ArtifactStage>
      <ArtifactStage material={material} still={still} label="Milestone medal" shape="medal"><MedalObject /></ArtifactStage>
      <ArtifactStage material={material} still={still} label="Momentum compass" shape="totem"><TotemObject /></ArtifactStage>
    </div>
  );
}
