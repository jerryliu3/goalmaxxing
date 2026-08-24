import {
  firstExpeditionRoute,
  resolveCheckpointProgress,
  type JourneyBiome,
} from "@cadence/shared/journey";

export type CombinedScene = "month" | "checks" | "insights" | "rank";
export type CanvasScene = CombinedScene;

export type SceneStop<T extends string> = {
  readonly at: number;
  readonly scene: T;
};

export type SceneState<T extends string> = {
  scene: T;
  local: number;
};

export const COMBINED_CHAPTER_HEIGHT_VH = 820;
export const CLIMB_LAST_PEAK = { x: 1180, y: 150 } as const;

type TrailPoint = { readonly x: number; readonly y: number };
type TrailCubic = {
  readonly p0: TrailPoint;
  readonly p1: TrailPoint;
  readonly p2: TrailPoint;
  readonly p3: TrailPoint;
};

const CLIMB_TRAIL_CUBICS = [
  { p0: { x: 150, y: 560 }, p1: { x: 250, y: 720 }, p2: { x: 330, y: 530 }, p3: { x: 430, y: 415 } },
  { p0: { x: 430, y: 415 }, p1: { x: 510, y: 330 }, p2: { x: 610, y: 350 }, p3: { x: 730, y: 430 } },
  { p0: { x: 730, y: 430 }, p1: { x: 850, y: 500 }, p2: { x: 990, y: 250 }, p3: { x: 1120, y: 175 } },
  { p0: { x: 1120, y: 175 }, p1: { x: 1155, y: 145 }, p2: { x: 1172, y: 148 }, p3: { x: 1180, y: 150 } },
] as const satisfies ReadonlyArray<TrailCubic>;

function cubicPoint(cubic: TrailCubic, t: number): TrailPoint {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  return {
    x: uu * u * cubic.p0.x + 3 * uu * t * cubic.p1.x + 3 * u * tt * cubic.p2.x + tt * t * cubic.p3.x,
    y: uu * u * cubic.p0.y + 3 * uu * t * cubic.p1.y + 3 * u * tt * cubic.p2.y + tt * t * cubic.p3.y,
  };
}

export function getClimbTrailPoint(progress: number): TrailPoint {
  const t = clamp01(progress);
  const last = CLIMB_TRAIL_CUBICS[CLIMB_TRAIL_CUBICS.length - 1];
  if (!last) {
    return { x: 150, y: 560 };
  }
  if (t >= 1) {
    return last.p3;
  }
  const scaled = t * CLIMB_TRAIL_CUBICS.length;
  const index = Math.min(Math.floor(scaled), CLIMB_TRAIL_CUBICS.length - 1);
  const cubic = CLIMB_TRAIL_CUBICS[index] ?? last;
  return cubicPoint(cubic, scaled - index);
}

export const CLIMB_TRAIL_PATH = CLIMB_TRAIL_CUBICS.map((cubic, index) => {
  const curve = `C ${cubic.p1.x} ${cubic.p1.y} ${cubic.p2.x} ${cubic.p2.y} ${cubic.p3.x} ${cubic.p3.y}`;
  return index === 0 ? `M ${cubic.p0.x} ${cubic.p0.y} ${curve}` : curve;
}).join(" ");

export const COMBINED_SCENE_STOPS = [
  { at: 0, scene: "month" },
  { at: 0.13, scene: "checks" },
  { at: 0.42, scene: "insights" },
  { at: 0.68, scene: "rank" },
] as const satisfies ReadonlyArray<SceneStop<CombinedScene>>;

export const YOU_XP_START = 3940;
export const YOU_XP_END = 4410;
export const MAYA_XP = 4280;
export const ALEX_XP = 3760;
export const CHECKLIST_ITEM_COUNT = 5;
export const HEATMAP_CELL_COUNT = 140;
export const MONTH_PILL_COUNT = 6;

const INSIGHTS_STATS_START = {
  totalActivities: 18,
  totalGoalsCompleted: 1,
  currentMonthActivities: 4,
  currentWeekActivities: 1,
  todayActivities: 0,
  activeStreakDays: 2,
} as const;

const INSIGHTS_STATS_END = {
  totalActivities: 142,
  totalGoalsCompleted: 6,
  currentMonthActivities: 31,
  currentWeekActivities: 8,
  todayActivities: 3,
  activeStreakDays: 12,
} as const;

export function getPinnedChapterProgress(
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number
) {
  const scrollable = Math.max(sectionHeight - viewportHeight, 0);
  if (scrollable <= 0) {
    return sectionTop <= 0 ? 1 : 0;
  }
  return clamp01(-sectionTop / scrollable);
}

export function clamp01(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function getSceneState<T extends string>(
  progress: number,
  stops: readonly SceneStop<T>[]
): SceneState<T> {
  const p = clamp01(progress);
  const first = stops[0];
  if (!first) {
    throw new Error("Scene stops are required.");
  }

  let index = 0;
  for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
    if (p >= stops[stopIndex].at) {
      index = stopIndex;
    }
  }

  const current = stops[index] ?? first;
  const nextAt = stops[index + 1]?.at ?? 1;
  const span = Math.max(nextAt - current.at, Number.EPSILON);

  return {
    scene: current.scene,
    local: clamp01((p - current.at) / span),
  };
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * clamp01(t);
}

function countByProgress(scene: string, local: number, total: number, activeScene: string) {
  if (total <= 0) {
    return 0;
  }
  if (scene === activeScene) {
    return Math.min(total, Math.floor(clamp01(local) * total + Number.EPSILON));
  }
  return 0;
}

export function getMonthPillCount(scene: string, local: number, total: number) {
  if (scene === "checks" || scene === "insights" || scene === "rank") {
    return Math.max(total, 0);
  }
  return countByProgress(scene, local, total, "month");
}

export function getInsightsRevealProgress(scene: string, local: number) {
  if (scene === "rank") {
    return 1;
  }
  if (scene === "insights") {
    return clamp01(local);
  }
  return 0;
}

export function getHeatmapFillCount(
  scene: string,
  local: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }
  return Math.min(
    total,
    Math.floor(getInsightsRevealProgress(scene, local) * total + Number.EPSILON)
  );
}

export function getInsightsStats(scene: string, local: number) {
  const t = getInsightsRevealProgress(scene, local);
  return {
    totalActivities: Math.round(
      lerp(INSIGHTS_STATS_START.totalActivities, INSIGHTS_STATS_END.totalActivities, t)
    ),
    totalGoalsCompleted: Math.round(
      lerp(
        INSIGHTS_STATS_START.totalGoalsCompleted,
        INSIGHTS_STATS_END.totalGoalsCompleted,
        t
      )
    ),
    currentMonthActivities: Math.round(
      lerp(
        INSIGHTS_STATS_START.currentMonthActivities,
        INSIGHTS_STATS_END.currentMonthActivities,
        t
      )
    ),
    currentWeekActivities: Math.round(
      lerp(
        INSIGHTS_STATS_START.currentWeekActivities,
        INSIGHTS_STATS_END.currentWeekActivities,
        t
      )
    ),
    todayActivities: Math.round(
      lerp(INSIGHTS_STATS_START.todayActivities, INSIGHTS_STATS_END.todayActivities, t)
    ),
    activeStreakDays: Math.round(
      lerp(INSIGHTS_STATS_START.activeStreakDays, INSIGHTS_STATS_END.activeStreakDays, t)
    ),
  };
}

export function getCheckedItemCount(
  scene: string,
  local: number,
  total: number
) {
  if (scene === "insights" || scene === "rank") {
    return Math.max(total, 0);
  }
  return countByProgress(scene, local, total, "checks");
}

export function getLeaderboardState(local: number) {
  const t = clamp01(local);
  const youXp = Math.round(YOU_XP_START + (YOU_XP_END - YOU_XP_START) * t);
  return {
    youRank: (youXp > MAYA_XP ? 1 : 2) as 1 | 2,
    youXp,
    mayaXp: MAYA_XP,
    alexXp: ALEX_XP,
  };
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const span = Math.max(edge1 - edge0, Number.EPSILON);
  const t = clamp01((value - edge0) / span);
  return t * t * (3 - 2 * t);
}

export function getLeaderboardTracks(local: number) {
  const board = getLeaderboardState(local);
  const xpSpan = Math.max(YOU_XP_END - YOU_XP_START, Number.EPSILON);
  const crossAt = clamp01((MAYA_XP - YOU_XP_START) / xpSpan);
  const swap = smoothstep(crossAt - 0.08, crossAt + 0.18, clamp01(local));

  return {
    ...board,
    youTrack: 1 - swap,
    mayaTrack: swap,
    alexTrack: 2,
    youLift: Math.sin(swap * Math.PI),
  };
}

export function shouldCelebrateYou(local: number) {
  if (clamp01(local) < 0.96) {
    return false;
  }
  const tracks = getLeaderboardTracks(local);
  return tracks.youRank === 1 && tracks.youTrack < 0.04 && tracks.youLift < 0.08;
}

export function getClimbBiome(progress: number): JourneyBiome {
  return resolveCheckpointProgress(firstExpeditionRoute, clamp01(progress)).biome;
}

export function getClimbCamera(progress: number) {
  const t = clamp01(progress);
  return {
    focalX: 0.48,
    focalY: 0.58 - t * 0.06,
    scale: 1.06 - t * 0.03,
    shiftY: (1 - t) * 2,
  };
}

export function getClimbIndicatorPosition(progress: number) {
  const point = getClimbTrailPoint(progress);
  return {
    x: (point.x / 1440) * 100,
    y: (point.y / 900) * 100,
  };
}

export function getCaption(scene: CombinedScene, local = 1) {
  switch (scene) {
    case "month":
      return local < 0.4
        ? "The future is still yours to fill."
        : "A month of intention, visible at a glance.";
    case "checks":
      return "Finishing the day starts to feel inevitable.";
    case "insights":
      return "You can finally feel the progress adding up.";
    case "rank":
      return "It hits different when someone else sees you climbing.";
  }
}
