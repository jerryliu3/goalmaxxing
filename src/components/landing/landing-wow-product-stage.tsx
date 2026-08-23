"use client";

import { Check, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  ALEX_XP,
  CHECKLIST_ITEM_COUNT,
  HEATMAP_CELL_COUNT,
  MONTH_PILL_COUNT,
  getCheckedItemCount,
  getHeatmapFillCount,
  getInsightsStats,
  getLeaderboardTracks,
  getMonthPillCount,
  shouldCelebrateYou,
  type CanvasScene,
  type CombinedScene,
} from "@/components/landing/landing-wow-progress";

const CHECKLIST_ITEMS = [
  "Morning run",
  "Deep work",
  "Launch notes",
  "Strength",
  "Weekly reset",
] as const;

const MONTH_PILLS = [
  { day: 4, label: "Deep work" },
  { day: 8, label: "Tempo" },
  { day: 12, label: "Review" },
  { day: 15, label: "Launch" },
  { day: 18, label: "Strength" },
  { day: 24, label: "Reset" },
] as const;

const HEATMAP_LEVELS = Array.from({ length: HEATMAP_CELL_COUNT }, (_, index) => {
  const pattern = [0, 1, 0, 2, 3, 0, 1, 2, 4, 3, 1, 2, 0, 3, 4, 2] as const;
  return pattern[index % pattern.length];
});

const CONFETTI_BITS = [
  { x: -22, y: -28, rotate: -28, color: "#C9A494", delay: 0 },
  { x: 20, y: -34, rotate: 22, color: "#9EAF93", delay: 0.04 },
  { x: -8, y: -40, rotate: 10, color: "#A9BCC8", delay: 0.08 },
  { x: 28, y: -18, rotate: -16, color: "#E2D4C4", delay: 0.02 },
  { x: -30, y: -12, rotate: 26, color: "#D4B562", delay: 0.06 },
  { x: 10, y: -24, rotate: -32, color: "#7E96A6", delay: 0.1 },
  { x: -14, y: -16, rotate: 14, color: "#F7F3EC", delay: 0.12 },
  { x: 18, y: -8, rotate: -8, color: "#C9A494", delay: 0.14 },
] as const;

function sceneTitle(scene: CanvasScene) {
  switch (scene) {
    case "month":
      return "August plan";
    case "checks":
      return "Today's list";
    case "insights":
      return "Overall stats";
    case "rank":
      return "Season leaderboard";
  }
}

export function LandingWowProductStage({
  scene,
  local,
}: {
  scene: CombinedScene;
  local: number;
}) {
  const productScene: CanvasScene = scene;
  const pillCount = getMonthPillCount(productScene, local, MONTH_PILL_COUNT);
  const checkedCount = getCheckedItemCount(
    productScene,
    local,
    CHECKLIST_ITEM_COUNT
  );
  const heatmapFillCount = getHeatmapFillCount(
    productScene,
    local,
    HEATMAP_CELL_COUNT
  );
  const stats = getInsightsStats(productScene, local);
  const rankLocal = productScene === "rank" ? local : 0;

  return (
    <div
      data-wow-product-scene={productScene}
      className="relative overflow-visible rounded-[28px] border border-stone-200/80 bg-[#F7F3EC]/92 text-[#3E3A36] shadow-[0_30px_80px_-36px_rgba(62,58,54,0.35)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#7E9174] uppercase">
            Goalmaxxing
          </p>
          <p className="text-sm font-semibold">{sceneTitle(productScene)}</p>
        </div>
        <span className="rounded-full bg-[#E8DFD2] px-2.5 py-1 text-[10px] text-[#6F6A64]">
          Live story
        </span>
      </div>

      <div className="relative min-h-[280px] p-5" style={{ perspective: 1180 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={productScene}
            initial={productScene === "month" ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {productScene === "month" ? (
              <MonthGrid visibleCount={pillCount} />
            ) : null}
            {productScene === "checks" ? (
              <Checklist checkedCount={checkedCount} />
            ) : null}
            {productScene === "insights" ? (
              <InsightsPanel fillCount={heatmapFillCount} stats={stats} />
            ) : null}
            {productScene === "rank" ? <Leaderboard local={rankLocal} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Leaderboard({ local }: { local: number }) {
  const tracks = getLeaderboardTracks(local);
  const celebrate = shouldCelebrateYou(local);
  const rowHeight = 56;
  const rows = [
    {
      name: "You",
      xp: tracks.youXp,
      you: true,
      track: tracks.youTrack,
      lift: tracks.youLift,
    },
    {
      name: "Maya",
      xp: tracks.mayaXp,
      you: false,
      track: tracks.mayaTrack,
      lift: 0,
    },
    {
      name: "Alex",
      xp: ALEX_XP,
      you: false,
      track: tracks.alexTrack,
      lift: 0,
    },
  ] as const;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="size-4 text-[#D4B562]" />
        <p className="text-xs font-semibold">Weekly XP Sprint</p>
      </div>
      <div className="relative h-[10.5rem] overflow-visible">
        {rows.map((row) => (
          <motion.div
            key={row.name}
            className="absolute inset-x-0"
            animate={{
              y: row.track * rowHeight,
              x: row.you ? row.lift * 12 : 0,
              scale: 1 + row.lift * 0.1,
              zIndex: row.you ? 8 : 1,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.8 }}
          >
            <div
              className={`relative flex items-center gap-3 rounded-xl border px-3 py-2 ${
                row.you
                  ? "border-[#A9BCC8] bg-[#D5DFE8]/80 shadow-[0_18px_40px_-18px_rgba(126,150,166,0.55)]"
                  : "border-stone-200 bg-white/70"
              }`}
            >
              <span className="w-4 text-xs font-semibold text-[#7E96A6]">
                {Math.round(row.track) + 1}
              </span>
              <span className="flex flex-1 items-center gap-1.5 text-sm font-medium">
                {row.name}
                {row.you && celebrate ? (
                  <Trophy
                    data-testid="wow-you-trophy"
                    className="size-3.5 text-[#D4B562]"
                  />
                ) : null}
              </span>
              <span className="text-[11px] text-[#6F6A64]">
                {row.xp.toLocaleString()} XP
              </span>
              {row.you && celebrate ? <YouConfetti /> : null}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function YouConfetti() {
  return (
    <span data-testid="wow-you-confetti" className="pointer-events-none absolute -top-1 right-6 z-10">
      {CONFETTI_BITS.map((bit) => (
        <motion.span
          key={`${bit.x}-${bit.y}-${bit.color}`}
          className="absolute block h-2.5 w-1.5 rounded-[1px] shadow-sm"
          style={{ backgroundColor: bit.color }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: bit.x,
            y: bit.y,
            rotate: bit.rotate,
            scale: 1,
          }}
          transition={{
            duration: 0.9,
            delay: bit.delay,
            repeat: Infinity,
            repeatDelay: 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </span>
  );
}

function MonthGrid({ visibleCount }: { visibleCount: number }) {
  const dates = Array.from({ length: 35 }, (_, index) =>
    index < 2 || index > 32 ? null : index - 1
  );
  const visiblePills = MONTH_PILLS.slice(0, visibleCount);

  return (
    <div className="grid grid-cols-7 grid-rows-5 gap-1">
      {dates.map((date, index) => {
        const pills = visiblePills.filter((entry) => entry.day === date);
        const isToday = date === 15;
        return (
          <div
            key={`${date ?? "empty"}-${index}`}
            className={`min-h-12 rounded-md border p-1 ${
              date
                ? isToday
                  ? "border-[#A9BCC8] bg-[#D5DFE8]/70"
                  : "border-stone-200 bg-white/70"
                : "border-transparent"
            }`}
          >
            {date ? (
              <>
                <p
                  className={`text-[9px] ${
                    isToday ? "font-semibold text-[#3E3A36]" : "text-[#8A847C]"
                  }`}
                >
                  {date}
                </p>
                <AnimatePresence>
                  {pills.map((pill) => (
                    <motion.p
                      key={pill.label}
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="mt-0.5 truncate rounded-sm bg-[#C5D0B8] px-1 text-[8px] font-medium text-[#3E3A36]"
                    >
                      {pill.label}
                    </motion.p>
                  ))}
                </AnimatePresence>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Checklist({ checkedCount }: { checkedCount: number }) {
  return (
    <div className="space-y-2">
      {CHECKLIST_ITEMS.map((item, index) => {
        const checked = index < checkedCount;
        return (
          <div
            key={item}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white/75 px-3 py-2.5"
          >
            <span
              className={`inline-flex size-5 items-center justify-center rounded-md border ${
                checked
                  ? "border-[#7E9174] bg-[#9EAF93] text-white"
                  : "border-stone-300 text-transparent"
              }`}
            >
              <Check className="size-3" />
            </span>
            <p
              className={`text-sm font-medium ${
                checked ? "text-[#8A847C] line-through" : "text-[#3E3A36]"
              }`}
            >
              {item}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function InsightsPanel({
  fillCount,
  stats,
}: {
  fillCount: number;
  stats: ReturnType<typeof getInsightsStats>;
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex w-full justify-between text-[8px] text-[#8A847C]">
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Aug</span>
        </div>
        <div
          data-testid="wow-insights-heatmap"
          className="grid h-[72px] w-full grid-flow-col grid-rows-7 auto-cols-fr gap-[3px]"
        >
          {HEATMAP_LEVELS.map((level, index) => {
            const filled = index < fillCount;
            return (
              <span
                key={`${level}-${index}`}
                className={`min-w-0 rounded-[2px] ${
                  filled ? `heatmap-scale-${level}` : "heatmap-scale-0"
                }`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[8px] text-[#8A847C]">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((scale) => (
            <span
              key={scale}
              className={`size-2.5 rounded-[2px] heatmap-scale-${scale}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Total Activities" value={stats.totalActivities} />
        <StatTile label="Total Goals Completed" value={stats.totalGoalsCompleted} />
        <StatTile label="Current Month" value={stats.currentMonthActivities} />
        <StatTile label="Current Week" value={stats.currentWeekActivities} />
        <StatTile label="Today's Activities" value={stats.todayActivities} />
        <StatTile
          label="Active Streak"
          value={`${stats.activeStreakDays} days`}
        />
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0 rounded-lg border border-stone-200 bg-white/70 p-2.5">
      <p className="text-[10px] text-[#8A847C]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
