"use client";

import "@/features/achievements/showcase-theme.css";
import type { PublicProfileGlobalAchievement } from "@cadence/shared/social/public-profile";
import { MedalMark } from "@/features/achievements/medals";
import { awardTierForLevel } from "@/features/achievements/tier";

export function ProfileMedalShelf({
  achievements,
  awardCatalogCount,
}: {
  achievements: PublicProfileGlobalAchievement[];
  awardCatalogCount: number;
}) {
  const earned = achievements
    .filter((achievement) => !achievement.revokedAt && achievement.level !== null)
    .sort((left, right) => (left.level ?? 0) - (right.level ?? 0));
  const unlockedCount = earned.length;
  const total = Math.max(awardCatalogCount, unlockedCount);
  const fill = total === 0 ? 0 : Math.round((unlockedCount / total) * 100);

  return (
    <section
      aria-label="Level medals"
      className="ach-showcase-root rounded-[16px] border bg-card px-4 py-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="ach-showcase-kicker type-eyebrow text-[10px]">
          Level medals
        </p>
        {total > 0 ? (
          <p className="ach-showcase-body font-mono text-xs">
            {unlockedCount}/{total} · {fill}%
          </p>
        ) : null}
      </div>
      {total > 0 ? (
        <div className="ach-showcase-track mt-3 h-1.5 overflow-hidden rounded-full">
          <div
            className="ach-showcase-fill h-full rounded-full"
            style={{ width: `${fill}%` }}
          />
        </div>
      ) : null}
      {earned.length === 0 ? (
        <p className="ach-showcase-body mt-4 text-sm text-muted-foreground">No medals yet.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {earned.map((achievement) => {
            const level = achievement.level ?? 0;
            const tier = awardTierForLevel(level);
            return (
              <li
                key={achievement.id}
                className="ach-showcase-mount flex flex-col items-center rounded-[14px] border px-2 py-4"
              >
                <MedalMark
                  level={level}
                  tier={tier}
                  size={64}
                  markId={`profile-medal-${achievement.id}`}
                />
                <span className="ach-showcase-stat-muted mt-2 font-mono text-[11px]">
                  Lv {level}
                </span>
                {achievement.title ? (
                  <span className="ach-showcase-kicker type-eyebrow mt-1 text-center text-[10px]">
                    {achievement.title}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
