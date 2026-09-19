"use client";

import { format, parseISO } from "date-fns";
import { Sparkles } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type {
  PublicProfileIdentity,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import { MaterialStage } from "@/features/ux-brand/card-materials/material-stage";
import { MATERIALS } from "@/features/ux-brand/card-materials/materials";
import { SolidLettering } from "@/features/ux-brand/card-materials/solid-lettering";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import "@/features/goals/tempo-goal-creation.css";
import styles from "./profile-membership-card.module.css";

const PEARL = MATERIALS.find((material) => material.id === "pearl")!;
const PEARL_COLOR = "#c4b089";

function Horizon({ monogram }: { monogram: string }) {
  return (
    <svg className={styles.horizon} viewBox="0 0 280 190" fill="none" aria-hidden="true">
      <circle cx="140" cy="91" r="65" stroke="currentColor" strokeWidth=".6" />
      <circle cx="140" cy="91" r="53" stroke="currentColor" strokeWidth=".6" strokeDasharray="1 5" />
      <circle cx="140" cy="91" r="36" fill="currentColor" opacity=".07" />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${139 + i * 7} Q70 ${92 + i * 9} 140 ${136 + i * 6} T280 ${120 + i * 9}`}
          stroke="currentColor"
          opacity={0.15 + i * 0.055}
          strokeWidth=".7"
        />
      ))}
      <text x="140" y="105" textAnchor="middle" fill="currentColor" className={styles.monogram}>
        {monogram}
      </text>
    </svg>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong>
        <SolidLettering>{value}</SolidLettering>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toLowerCase();
  }
  return name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toLowerCase() || "gm";
}

function formatMemberSince(createdAt: string | null) {
  const dateOnly = createdAt?.slice(0, 10);
  if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }
  return format(parseISO(dateOnly), "MMMM yyyy").toUpperCase();
}

export function ProfileMembershipCard({
  profile,
  overallStats,
  currentLevel,
}: {
  profile: PublicProfileIdentity;
  overallStats: PublicProfileOverallStats | null;
  currentLevel: number | null;
}) {
  const reducedMotion = useReducedMotion();
  if (profile.isPrivate || !overallStats) {
    return null;
  }

  const title = resolvePublicProfileLabel(profile);
  const monogram = initialsFromName(title.replace(/^@/, ""));
  const memberSince = formatMemberSince(profile.createdAt);
  const handle = profile.username ? `@${profile.username}` : "Goalmaxxing member";

  return (
    <div className={styles.embed}>
      <MaterialStage
        material={PEARL}
        color={PEARL_COLOR}
        still={Boolean(reducedMotion)}
        label={`${title} membership card`}
        embedded
        controls={false}
      >
        <article className={`tempo-card ${styles.face}`} aria-label={`${title} membership card`}>
          <div className={styles.micro}>
            <span>GOALMAXXING / MEMBER</span>
            <Sparkles size={17} strokeWidth={1.2} />
          </div>
          <div className={styles.identityArt}>
            <Horizon monogram={monogram} />
            <span className={styles.serial}>{handle.toUpperCase()}</span>
          </div>
          <div className={styles.titleBlock}>
            <span className={styles.kicker}>{handle}</span>
            <h2>
              <SolidLettering>{title}</SolidLettering>
            </h2>
          </div>
          <div className={styles.metrics}>
            <Metric value={String(overallStats.totalGoalsCompleted)} label="goals completed" />
            <Metric value={String(overallStats.totalActivities)} label="activities" />
            <Metric value={String(overallStats.activeStreakDays)} label="day streak" />
          </div>
          <div className={styles.signature}>
            <span>
              <SolidLettering>{title}</SolidLettering>
            </span>
            {memberSince ? (
              <span>
                MEMBER SINCE
                <br />
                {memberSince}
              </span>
            ) : (
              <span>MEMBER</span>
            )}
          </div>
          <div className={styles.micro}>
            <span>PEARL RESERVE</span>
            {currentLevel != null ? <span>LEVEL {currentLevel}</span> : <span>MEMBER</span>}
          </div>
        </article>
      </MaterialStage>
    </div>
  );
}
