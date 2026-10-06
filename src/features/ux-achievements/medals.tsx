import { GAZETTEER, GAZETTEER_CATEGORY_COLORS } from "@cadence/shared/brand/gazetteer";
import type { AchievementGoalCategory } from "@/features/achievements/types";

export {
  CompletionRings,
  MedalMark,
  SealMark,
  TIER_METAL,
} from "@/features/achievements/medals";

/** Finished-goal plaque for the reference concepts; production retired the plaque rail. */
export function PlaqueMark({
  category,
  size = 56,
}: {
  category: AchievementGoalCategory;
  size?: number;
}) {
  const fill = GAZETTEER_CATEGORY_COLORS[category];
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden>
      <rect
        x="6"
        y="8"
        width="44"
        height="40"
        rx="4"
        fill={GAZETTEER.paper}
        stroke={GAZETTEER.rule}
        strokeWidth="1.5"
      />
      <rect x="10" y="12" width="36" height="6" rx="1.5" fill={fill} opacity="0.9" />
      <rect x="10" y="24" width="28" height="3" rx="1" fill={GAZETTEER.rule} />
      <rect x="10" y="31" width="22" height="3" rx="1" fill={GAZETTEER.rule} />
      <rect x="10" y="38" width="16" height="3" rx="1" fill={GAZETTEER.rule} />
      <circle cx="40" cy="40" r="6" fill={fill} />
      <path
        d="M37.5 40 L39.2 41.7 L42.8 37.8"
        fill="none"
        stroke={GAZETTEER.paper}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
