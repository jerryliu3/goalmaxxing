"use client";

import {
  addDays,
  eachDayOfInterval,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import {
  RecoverBanner,
  TONE_DOT,
  TONE_PILL,
} from "@/features/ux-concepts/concept-primitives";
import {
  PLAN_DIVE_TRANSITION,
  PLAN_FADE_TRANSITION,
  PLAN_ZOOM_TRANSITION,
  type PlanZoomMotion,
  type PlanZoomRange,
} from "@/features/ux-concepts/plan-zoom-motion";
import { zoomItemsOnDate } from "@/features/ux-concepts/plan-zoom-seed";
import {
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
  type ConceptItem,
} from "@/features/ux-concepts/seed";
import {
  itemKindLabel,
  type ConceptSession,
} from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

type DayVisual = "cell" | "agenda" | "focus";

function monthWeeks(anchor: string) {
  const start = startOfWeek(startOfMonth(parseISO(anchor)), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end: addDays(start, 41) });
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function weekStartIso(date: string) {
  return format(startOfWeek(parseISO(date), { weekStartsOn: 0 }), "yyyy-MM-dd");
}

function resolveDayVisual(
  range: PlanZoomRange,
  iso: string,
  selectedDate: string,
  weekFocused: boolean
): DayVisual {
  if (!weekFocused || range === "month") {
    return "cell";
  }
  if (range === "day" && iso === selectedDate) {
    return "focus";
  }
  return "agenda";
}

export function PlanZoomStage({
  session,
  range,
  motionMode,
  onOpenDay,
}: {
  session: ConceptSession;
  range: PlanZoomRange;
  motionMode: PlanZoomMotion;
  onOpenDay: (iso: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const weeks = useMemo(() => monthWeeks(CONCEPT_TODAY), []);
  const focusedWeekStart = weekStartIso(session.selectedDate);
  const zoomTransition =
    reduceMotion || motionMode === "fade"
      ? { duration: 0 }
      : motionMode === "dive"
        ? PLAN_DIVE_TRANSITION
        : PLAN_ZOOM_TRANSITION;

  if (motionMode === "fade") {
    return (
      <FadePlanStage
        session={session}
        range={range}
        weeks={weeks}
        focusedWeekStart={focusedWeekStart}
        onOpenDay={onOpenDay}
      />
    );
  }

  const weekTemplate = weeks
    .map((days) => {
      const weekKey = format(days[0]!, "yyyy-MM-dd");
      const focused = weekKey === focusedWeekStart;
      if (range === "month" || focused) {
        return "minmax(0, 1fr)";
      }
      return "0fr";
    })
    .join(" ");

  return (
    <LayoutGroup id="plan-zoom">
      <div
        data-plan-zoom="true"
        data-plan-zoom-motion={motionMode}
        className="relative isolate flex h-full min-h-0 flex-col overflow-hidden"
      >
        <div
          className="overflow-hidden"
          style={{
            height: range === "month" ? "1.75rem" : 0,
            opacity: range === "month" ? 1 : 0,
            transition: reduceMotion
              ? "none"
              : "height var(--plan-zoom-duration) var(--motion-ease-emphasized), opacity var(--plan-zoom-duration) var(--motion-ease-emphasized)",
          }}
        >
          <div className="grid grid-cols-7 gap-px px-1 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((label, index) => (
              <div key={`${label}-${index}`} className="py-1">
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <motion.div
            className="h-full min-h-0"
            initial={false}
            animate={
              motionMode === "dive"
                ? {
                    scale: range === "month" ? 0.9 : range === "day" ? 1.03 : 1,
                  }
                : { scale: 1 }
            }
            transition={zoomTransition}
            style={{ transformOrigin: "center top" }}
          >
            <div
              data-plan-zoom-grid="true"
              style={{ gridTemplateRows: weekTemplate }}
            >
              {weeks.map((days) => {
                const weekKey = format(days[0]!, "yyyy-MM-dd");
                const weekFocused = weekKey === focusedWeekStart;
                return (
                  <div key={weekKey} data-plan-zoom-track="true">
                    <WeekBand
                      days={days}
                      session={session}
                      range={range}
                      motionMode={motionMode}
                      weekFocused={weekFocused}
                      transition={zoomTransition}
                      onOpenDay={onOpenDay}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </LayoutGroup>
  );
}

function WeekBand({
  days,
  session,
  range,
  motionMode,
  weekFocused,
  transition,
  onOpenDay,
}: {
  days: Date[];
  session: ConceptSession;
  range: PlanZoomRange;
  motionMode: PlanZoomMotion;
  weekFocused: boolean;
  transition: typeof PLAN_ZOOM_TRANSITION | { duration: number };
  onOpenDay: (iso: string) => void;
}) {
  const stacked = weekFocused && range !== "month";
  const selectedIndex = Math.max(
    0,
    days.findIndex((day) => format(day, "yyyy-MM-dd") === session.selectedDate)
  );
  const originY = `${((selectedIndex + 0.5) / 7) * 100}%`;
  const dayTemplate = days
    .map((day) => {
      const iso = format(day, "yyyy-MM-dd");
      if (!stacked) {
        return "minmax(0, 1fr)";
      }
      if (range === "week" || iso === session.selectedDate) {
        return "minmax(0, 1fr)";
      }
      return "0fr";
    })
    .join(" ");

  return (
    <div
      className="h-full min-h-0"
      style={{
        transformOrigin: motionMode === "dive" ? `50% ${originY}` : "center top",
      }}
    >
      <div
        data-plan-zoom-grid={stacked ? "true" : undefined}
        className={cn(
          "h-full min-h-0",
          stacked ? undefined : "grid grid-cols-7 gap-px px-1 pb-1"
        )}
        style={stacked ? { gridTemplateRows: dayTemplate } : undefined}
      >
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const visual = resolveDayVisual(
            range,
            iso,
            session.selectedDate,
            weekFocused
          );
          const dayCollapsed =
            range === "day" && stacked && iso !== session.selectedDate;
          const isAbove = iso < session.selectedDate;
          return (
            <div key={iso} data-plan-zoom-track={stacked ? "true" : undefined}>
              <DayLane
                day={day}
                iso={iso}
                session={session}
                visual={visual}
                collapsed={dayCollapsed}
                motionMode={motionMode}
                isAbove={isAbove}
                transition={transition}
                onOpenDay={onOpenDay}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayLane({
  day,
  iso,
  session,
  visual,
  collapsed,
  motionMode,
  isAbove,
  transition,
  onOpenDay,
}: {
  day: Date;
  iso: string;
  session: ConceptSession;
  visual: DayVisual;
  collapsed: boolean;
  motionMode: PlanZoomMotion;
  isAbove: boolean;
  transition: typeof PLAN_ZOOM_TRANSITION | { duration: number };
  onOpenDay: (iso: string) => void;
}) {
  const items = zoomItemsOnDate(iso, session.recoveredTo);
  const selected = iso === session.selectedDate;
  const isToday = iso === CONCEPT_TODAY;
  const inMonth = isSameMonth(day, parseISO(CONCEPT_TODAY));
  const missed = iso === STRENGTH_MISSED_DATE && !session.recovered;
  const dive = motionMode === "dive";

  return (
    <motion.div
      layout={!collapsed}
      layoutId={`plan-zoom-day-${iso}`}
      transition={transition}
      initial={false}
      animate={{
        opacity: collapsed ? 0 : 1,
        scaleY: collapsed && dive ? 0.2 : 1,
      }}
      style={{
        overflow: "hidden",
        height: "100%",
        transformOrigin: collapsed
          ? isAbove
            ? "center bottom"
            : "center top"
          : "center top",
        pointerEvents: collapsed ? "none" : undefined,
      }}
      className={cn(
        "min-h-0 min-w-0",
        visual === "cell" && "px-0.5 py-1",
        visual !== "cell" && "border-b border-border/60 last:border-b-0",
        selected && visual !== "cell" && "bg-primary/5",
        missed && visual !== "cell" && "bg-amber-50/80"
      )}
    >
      {visual === "cell" ? (
        <button
          type="button"
          onClick={() => onOpenDay(iso)}
          className={cn(
            "flex h-full min-h-[3.4rem] w-full flex-col items-center rounded-lg px-0.5 py-1 text-xs touch-manipulation md:min-h-[4.2rem]",
            !inMonth && "opacity-35",
            selected && "bg-primary/10 ring-1 ring-primary/40",
            missed && !selected && "bg-amber-50"
          )}
          aria-label={format(day, "EEEE, MMM d")}
          aria-current={isToday ? "date" : undefined}
          aria-pressed={selected}
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full",
              isToday && "bg-primary text-primary-foreground"
            )}
          >
            {format(day, "d")}
          </span>
          <span className="mt-1 flex min-h-2 items-center justify-center gap-0.5">
            {items.slice(0, 3).map((item) => (
              <ZoomItem
                key={item.id}
                item={item}
                density="dot"
                completed={session.isComplete(item.id)}
                unplaced={item.id === "strength" && !session.recovered}
                onOpen={() => onOpenDay(iso)}
                onToggle={() => session.toggleComplete(item.id)}
              />
            ))}
          </span>
        </button>
      ) : visual === "agenda" ? (
        <div className="flex items-start gap-2 py-3">
          <button
            type="button"
            onClick={() => onOpenDay(iso)}
            className="w-14 shrink-0 px-1 text-left touch-manipulation"
            aria-label={format(day, "EEEE, MMM d")}
            aria-current={isToday ? "date" : undefined}
            aria-pressed={selected}
          >
            <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {format(day, "EEE")}
            </span>
            <span
              className={cn(
                "mt-0.5 inline-flex size-8 items-center justify-center rounded-full text-lg font-semibold leading-none",
                isToday && "bg-primary text-primary-foreground",
                !isToday && selected && "text-primary"
              )}
            >
              {format(day, "d")}
            </span>
          </button>
          <div className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5">
            {items.length === 0 ? (
              <button
                type="button"
                onClick={() => onOpenDay(iso)}
                className="min-h-[2.75rem] w-full rounded-lg px-2 text-left text-sm text-muted-foreground touch-manipulation"
              >
                No work this day
              </button>
            ) : (
              items.map((item) => (
                <ZoomItem
                  key={item.id}
                  item={item}
                  density="pill"
                  completed={session.isComplete(item.id)}
                  unplaced={item.id === "strength" && !session.recovered}
                  onOpen={() => {
                    if (item.id === "strength" && !session.recovered) {
                      session.setSelectedDate(iso);
                      session.setRecoverOpen(true);
                      return;
                    }
                    onOpenDay(iso);
                  }}
                  onToggle={() => session.toggleComplete(item.id)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <FocusedDay
          iso={iso}
          items={items}
          session={session}
          onOpenDay={onOpenDay}
        />
      )}
    </motion.div>
  );
}

function FocusedDay({
  iso,
  items,
  session,
  onOpenDay,
}: {
  iso: string;
  items: ConceptItem[];
  session: ConceptSession;
  onOpenDay: (iso: string) => void;
}) {
  const openItems = items.filter((item) => !session.isComplete(item.id));
  const doneItems = items.filter((item) => session.isComplete(item.id));
  const showRecover =
    !session.recovered &&
    (iso === CONCEPT_TODAY || iso === STRENGTH_MISSED_DATE);
  const nextTitle = openItems[0]?.title;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-1 pb-4 pt-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {format(parseISO(iso), "EEEE, MMM d")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {openItems.length} left
            {nextTitle ? ` · next is ${nextTitle}` : ""}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {iso === CONCEPT_TODAY ? "Today" : "This day"}
        </span>
      </div>
      {showRecover ? (
        <div className="mt-3">
          <RecoverBanner
            recovered={session.recovered}
            onOpen={() => session.setRecoverOpen(true)}
          />
        </div>
      ) : null}
      <div className="mt-2 min-h-0 flex-1">
        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => onOpenDay(iso)}
            className="py-6 text-left text-sm text-muted-foreground"
          >
            No work placed on this day.
          </button>
        ) : (
          <>
            {openItems.map((item) => (
              <ZoomItem
                key={item.id}
                item={item}
                density="row"
                completed={false}
                unplaced={item.id === "strength" && !session.recovered}
                onOpen={() => session.setSelectedItemId(item.id)}
                onToggle={() => session.toggleComplete(item.id)}
              />
            ))}
            {doneItems.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Done
                </h3>
                {doneItems.map((item) => (
                  <ZoomItem
                    key={item.id}
                    item={item}
                    density="row"
                    completed
                    unplaced={false}
                    onOpen={() => session.setSelectedItemId(item.id)}
                    onToggle={() => session.toggleComplete(item.id)}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function ZoomItem({
  item,
  density,
  completed,
  unplaced,
  onOpen,
  onToggle,
}: {
  item: ConceptItem;
  density: "dot" | "pill" | "row";
  completed: boolean;
  unplaced: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  if (density === "dot") {
    return (
      <motion.span
        layoutId={`plan-zoom-item-${item.id}`}
        className={cn("size-1.5 rounded-full", TONE_DOT[item.tone])}
        aria-hidden
      />
    );
  }

  if (density === "pill") {
    return (
      <motion.button
        type="button"
        layoutId={`plan-zoom-item-${item.id}`}
        onClick={onOpen}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left ring-1 touch-manipulation",
          completed ? "bg-muted/70 ring-border/60" : TONE_PILL[item.tone],
          unplaced && "ring-amber-400/80"
        )}
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[item.tone])} />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            completed && "text-muted-foreground line-through"
          )}
        >
          {item.title}
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {unplaced ? "unplaced" : item.kind === "task" ? "task" : item.cadence}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      layoutId={`plan-zoom-item-${item.id}`}
      className={cn(
        "flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0",
        completed && "opacity-55"
      )}
    >
      <CompletionToggle
        completed={completed}
        size="lg"
        onClick={onToggle}
        aria-label={
          completed
            ? `Remove completion for ${item.title}`
            : `Complete ${item.title}`
        }
      />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 touch-manipulation text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-[15px] font-semibold tracking-tight",
              completed && "text-muted-foreground line-through"
            )}
          >
            {item.title}
          </span>
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {itemKindLabel(item)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {item.cadence}
          <span className="mx-1.5">·</span>
          {item.category}
        </p>
      </button>
      <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[item.tone])} />
    </motion.div>
  );
}

function FadePlanStage({
  session,
  range,
  weeks,
  focusedWeekStart,
  onOpenDay,
}: {
  session: ConceptSession;
  range: PlanZoomRange;
  weeks: Date[][];
  focusedWeekStart: string;
  onOpenDay: (iso: string) => void;
}) {
  const focusedWeek =
    weeks.find((days) => format(days[0]!, "yyyy-MM-dd") === focusedWeekStart) ??
    weeks[0]!;

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={range}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={PLAN_FADE_TRANSITION}
          className="h-full min-h-0 overflow-y-auto"
        >
          {range === "month" ? (
            <div className="rounded-2xl bg-card p-2 ring-1 ring-foreground/10 md:p-3">
              <div className="grid grid-cols-7 gap-px text-center text-[11px] font-medium text-muted-foreground">
                {WEEKDAYS.map((label, index) => (
                  <div key={`${label}-${index}`} className="py-1">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {weeks.flat().map((day) => {
                  const iso = format(day, "yyyy-MM-dd");
                  return (
                    <MonthCell
                      key={iso}
                      day={day}
                      iso={iso}
                      session={session}
                      onOpenDay={onOpenDay}
                    />
                  );
                })}
              </div>
            </div>
          ) : range === "week" ? (
            <ol className="flex flex-col">
              {focusedWeek.map((day) => {
                const iso = format(day, "yyyy-MM-dd");
                return (
                  <StaticAgendaDay
                    key={iso}
                    day={day}
                    iso={iso}
                    session={session}
                    onOpenDay={onOpenDay}
                  />
                );
              })}
            </ol>
          ) : (
            <FocusedDay
              iso={session.selectedDate}
              items={zoomItemsOnDate(session.selectedDate, session.recoveredTo)}
              session={session}
              onOpenDay={onOpenDay}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MonthCell({
  day,
  iso,
  session,
  onOpenDay,
}: {
  day: Date;
  iso: string;
  session: ConceptSession;
  onOpenDay: (iso: string) => void;
}) {
  const items = zoomItemsOnDate(iso, session.recoveredTo);
  const selected = iso === session.selectedDate;
  const isToday = iso === CONCEPT_TODAY;
  const inMonth = isSameMonth(day, parseISO(CONCEPT_TODAY));
  const missed = iso === STRENGTH_MISSED_DATE && !session.recovered;
  return (
    <button
      type="button"
      onClick={() => onOpenDay(iso)}
      className={cn(
        "flex min-h-[3.4rem] flex-col items-center rounded-lg px-0.5 py-1 text-xs touch-manipulation md:min-h-[4.5rem]",
        !inMonth && "opacity-35",
        selected && "bg-primary/10 ring-1 ring-primary/40",
        missed && !selected && "bg-amber-50"
      )}
      aria-label={format(day, "EEEE, MMM d")}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full",
          isToday && "bg-primary text-primary-foreground"
        )}
      >
        {format(day, "d")}
      </span>
      <span className="mt-1 flex gap-0.5">
        {items.slice(0, 3).map((item) => (
          <span
            key={item.id}
            className={cn("size-1.5 rounded-full", TONE_DOT[item.tone])}
          />
        ))}
      </span>
    </button>
  );
}

function StaticAgendaDay({
  day,
  iso,
  session,
  onOpenDay,
}: {
  day: Date;
  iso: string;
  session: ConceptSession;
  onOpenDay: (iso: string) => void;
}) {
  const items = zoomItemsOnDate(iso, session.recoveredTo);
  const selected = iso === session.selectedDate;
  const isToday = iso === CONCEPT_TODAY;
  const missed = iso === STRENGTH_MISSED_DATE && !session.recovered;
  return (
    <li
      className={cn(
        "border-b border-border/60 last:border-b-0",
        selected && "bg-primary/5",
        missed && "bg-amber-50/80"
      )}
    >
      <div className="flex items-start gap-2 py-3">
        <button
          type="button"
          onClick={() => onOpenDay(iso)}
          className="w-14 shrink-0 px-1 text-left touch-manipulation"
        >
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {format(day, "EEE")}
          </span>
          <span
            className={cn(
              "mt-0.5 inline-flex size-8 items-center justify-center rounded-full text-lg font-semibold leading-none",
              isToday && "bg-primary text-primary-foreground",
              !isToday && selected && "text-primary"
            )}
          >
            {format(day, "d")}
          </span>
        </button>
        <div className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5">
          {items.length === 0 ? (
            <button
              type="button"
              onClick={() => onOpenDay(iso)}
              className="min-h-[2.75rem] w-full rounded-lg px-2 text-left text-sm text-muted-foreground"
            >
              No work this day
            </button>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenDay(iso)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left ring-1",
                  session.isComplete(item.id)
                    ? "bg-muted/70 ring-border/60"
                    : TONE_PILL[item.tone]
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", TONE_DOT[item.tone])}
                />
                <span className="truncate text-sm font-medium">{item.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </li>
  );
}
