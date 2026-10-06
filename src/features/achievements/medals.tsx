import { GAZETTEER } from "@/lib/brand/gazetteer";
import type { AwardTier } from "@/features/achievements/types";

export const TIER_METAL: Record<
  AwardTier,
  { rim: string; face: string; glow: string; ink: string }
> = {
  bronze: {
    rim: "#8B5E3C",
    face: "#C88968",
    glow: "#E8C4A8",
    ink: GAZETTEER.ink,
  },
  copper: {
    rim: GAZETTEER.stamp,
    face: GAZETTEER.stampLight,
    glow: "#E8B89A",
    ink: GAZETTEER.paper,
  },
  sage: {
    rim: "#4F5F56",
    face: GAZETTEER.sage,
    glow: "#A8B8AE",
    ink: GAZETTEER.paper,
  },
  gold: {
    rim: "#8A6A3A",
    face: "#D4A84B",
    glow: "#F0D78A",
    ink: GAZETTEER.ink,
  },
  ink: {
    rim: GAZETTEER.mutedDeep,
    face: GAZETTEER.ink,
    glow: GAZETTEER.rule,
    ink: GAZETTEER.paper,
  },
};

export function MedalMark({
  level,
  tier,
  locked = false,
  size = 88,
  markId,
}: {
  level: number;
  tier: AwardTier;
  locked?: boolean;
  size?: number;
  markId?: string;
}) {
  const metal = TIER_METAL[tier];
  const rim = locked ? GAZETTEER.rule : metal.rim;
  const face = locked ? "#EDE4D4" : metal.face;
  const glow = locked ? "#F5EFE3" : metal.glow;
  const ink = locked ? GAZETTEER.muted : metal.ink;
  const uid = markId ?? `m${level}-${locked ? "l" : "u"}-${tier}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      aria-hidden
      className={locked ? "opacity-70" : undefined}
    >
      <defs>
        <radialGradient id={`medal-face-${uid}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={glow} />
          <stop offset="55%" stopColor={face} />
          <stop offset="100%" stopColor={rim} />
        </radialGradient>
        <linearGradient id={`ribbon-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={locked ? GAZETTEER.rule : GAZETTEER.stamp} />
          <stop offset="100%" stopColor={locked ? "#CABB9E" : GAZETTEER.colRust} />
        </linearGradient>
      </defs>
      <path
        d="M34 58 L28 82 L44 72 L60 82 L54 58 Z"
        fill={`url(#ribbon-${uid})`}
      />
      <circle cx="44" cy="38" r="30" fill={rim} />
      <circle cx="44" cy="38" r="26" fill={`url(#medal-face-${uid})`} />
      <circle
        cx="44"
        cy="38"
        r="21"
        fill="none"
        stroke={locked ? GAZETTEER.rule : glow}
        strokeWidth="1.5"
        opacity="0.85"
      />
      <circle
        cx="44"
        cy="38"
        r="17"
        fill="none"
        stroke={ink}
        strokeWidth="1"
        strokeDasharray={locked ? "2 3" : undefined}
        opacity={locked ? 0.45 : 0.35}
      />
      <text
        x="44"
        y="43"
        textAnchor="middle"
        fontFamily="var(--font-app-mono), ui-monospace, monospace"
        fontSize="18"
        fontWeight="600"
        fill={ink}
      >
        {locked ? "—" : level}
      </text>
    </svg>
  );
}

export function SealMark({
  locked,
  tier,
  size = 48,
}: {
  locked: boolean;
  tier: AwardTier;
  size?: number;
}) {
  const metal = TIER_METAL[tier];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle
        cx="24"
        cy="24"
        r="18"
        fill={locked ? GAZETTEER.ink : metal.face}
        stroke={locked ? "#3A3128" : metal.rim}
        strokeWidth="2"
      />
      {locked ? (
        <>
          <rect x="18" y="20" width="12" height="10" rx="2" fill={GAZETTEER.muted} />
          <path
            d="M20 20 V17 A4 4 0 0 1 28 17 V20"
            fill="none"
            stroke={GAZETTEER.muted}
            strokeWidth="2"
          />
        </>
      ) : (
        <path
          d="M24 12 L27 20 L36 21 L29.5 27 L31.5 36 L24 31.5 L16.5 36 L18.5 27 L12 21 L21 20 Z"
          fill={metal.glow}
          stroke={metal.rim}
          strokeWidth="1"
        />
      )}
    </svg>
  );
}

export function CompletionRings({
  awardsPct,
  goalsPct,
  levelPct,
  size = 220,
  active,
}: {
  awardsPct: number;
  goalsPct: number;
  levelPct: number;
  size?: number;
  active?: "awards" | "goals" | "level" | null;
}) {
  const cx = 110;
  const cy = 110;
  const rings = [
    { key: "awards" as const, r: 92, pct: awardsPct, color: GAZETTEER.stamp, track: "#e5d9c4" },
    { key: "goals" as const, r: 70, pct: goalsPct, color: GAZETTEER.gain, track: "#dfe6d8" },
    { key: "level" as const, r: 48, pct: levelPct, color: GAZETTEER.sage, track: "#d8e0dc" },
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" aria-hidden>
      {rings.map((ring) => {
        const circ = 2 * Math.PI * ring.r;
        const dash = Math.max(0, Math.min(1, ring.pct)) * circ;
        const dim = active && active !== ring.key;
        return (
          <g key={ring.key} opacity={dim ? 0.35 : 1}>
            <circle
              cx={cx}
              cy={cy}
              r={ring.r}
              fill="none"
              stroke={ring.track}
              strokeWidth="14"
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={cy}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </g>
        );
      })}
    </svg>
  );
}
