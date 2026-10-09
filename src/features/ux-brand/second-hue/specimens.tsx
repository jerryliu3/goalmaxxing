"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { goalCategoryPigment, goalCategoryColor, type TabChromeKind } from "@cadence/shared/brand";
import { APP_TABS } from "@/components/navigation/tabs";
import { tabChromeClasses } from "@/components/navigation/tab-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  planLedgerSubtitleClass,
  planLedgerTitleClass,
  planMonthDayNumberClass,
  planMonthDaySurfaceClass,
  planSelectedWorkRowClass,
} from "@/features/planner/calendar-day-chrome";
import { cn } from "@/lib/utils";
import { HUE_JOBS, jobAsPrimary, type HueJob, type HueMix } from "./model";

/*
 * Specimens paint through the board's `--job-<job>-fill|on|line` variables.
 * Production components that use `primary` are re-pointed with jobAsPrimary;
 * controls whose selection is neutral take a scoped class override instead.
 * Under the ink tone, in-page controls keep their shipped neutral treatment.
 */

const TODAY = 9;
const WEEK = [
  { label: "Mon", date: 5 },
  { label: "Tue", date: 6 },
  { label: "Wed", date: 7 },
  { label: "Thu", date: 8 },
  { label: "Fri", date: 9 },
  { label: "Sat", date: 10 },
  { label: "Sun", date: 11 },
] as const;

const MONTH_PILLS: Partial<Record<number, { title: string; category: string }[]>> = {
  6: [{ title: "Run", category: "health" }],
  9: [
    { title: "Run", category: "health" },
    { title: "Portfolio", category: "career" },
  ],
  10: [{ title: "Call Mom", category: "relationships" }],
  13: [{ title: "Budget", category: "finance" }],
  15: [{ title: "Sketch", category: "personal" }],
};

const ROWS = [
  { id: "run", title: "Morning run", meta: "Health · 30 min", category: "health" },
  { id: "portfolio", title: "Portfolio review", meta: "Career · 1 of 3 this week", category: "career" },
  { id: "call", title: "Call Mom", meta: "Interpersonal · Sunday", category: "relationships" },
] as const;

const jobLabels = Object.fromEntries(HUE_JOBS.map((job) => [job.id, job.label])) as Record<HueJob, string>;

export function Specimen({
  jobs,
  title,
  children,
  className,
}: {
  jobs: readonly HueJob[];
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <p className="type-eyebrow text-[10px] text-muted-foreground">
        {title} · {jobs.map((job) => jobLabels[job]).join(" + ")}
      </p>
      {children}
    </section>
  );
}

function categoryPillStyle(category: string): CSSProperties {
  const pigment = goalCategoryPigment(goalCategoryColor(category));
  return {
    background: `color-mix(in srgb, ${pigment} 22%, var(--background))`,
    boxShadow: `inset 2px 0 0 ${pigment}`,
  };
}

export function AppTabsSpecimen({
  chrome,
  mobile,
}: {
  chrome: TabChromeKind;
  mobile: boolean;
}) {
  const [active, setActive] = useState<string>(APP_TABS[0].key);
  const classes = tabChromeClasses(chrome, mobile, "grid-cols-4");
  const filled = mobile && chrome === "pills";
  const highlight = cn(
    classes.highlight,
    filled
      ? "bg-[color:var(--job-place-fill)]"
      : mobile
        ? "border-[color:var(--job-place-line)]"
        : "bg-[color:var(--job-place-line)]"
  );
  return (
    <div className={cn(mobile ? "flex justify-center" : "flex justify-center border-b border-border")}>
      <div className={cn(classes.list, mobile && "max-w-none")}>
        {APP_TABS.map((tab) => {
          const selected = tab.key === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => setActive(tab.key)}
              className={cn(
                classes.link,
                selected
                  ? filled
                    ? "text-[color:var(--job-place-on)]"
                    : classes.linkActive
                  : classes.linkIdle
              )}
            >
              {selected ? <span aria-hidden className={highlight} /> : null}
              <Icon className={mobile ? "size-[18px]" : "size-4"} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const VIEWS = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
] as const;

type View = (typeof VIEWS)[number]["value"];

export function ViewSwitcherSpecimen({ mix }: { mix: HueMix }) {
  const [view, setView] = useState<View>("month");
  return (
    <SegmentedControl
      label="Calendar view"
      options={VIEWS}
      value={view}
      onChange={setView}
      className={
        mix.place === "ink"
          ? undefined
          : "[&>span]:bg-[color:var(--job-place-fill)] [&>button[aria-pressed=true]]:text-[color:var(--job-place-on)]"
      }
    />
  );
}

export function InPageTabsSpecimen({
  mix,
  variant,
}: {
  mix: HueMix;
  variant: "default" | "line";
}) {
  const options = variant === "line" ? ["Upcoming", "Done", "Missed"] : ["Sessions", "Tasks"];
  const trigger =
    variant === "line"
      ? "after:bg-[color:var(--job-place-line)]"
      : mix.place === "ink"
        ? undefined
        : "data-[state=active]:bg-[color:var(--job-place-fill)] data-[state=active]:text-[color:var(--job-place-on)]";
  return (
    <Tabs defaultValue={options[0]}>
      <TabsList variant={variant}>
        {options.map((option) => (
          <TabsTrigger key={option} value={option} className={trigger}>
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function WeekStripSpecimen() {
  const [selected, setSelected] = useState(10);
  return (
    <div className="flex justify-between gap-1">
      {WEEK.map((day) => {
        const isToday = day.date === TODAY;
        const isSelected = day.date === selected;
        return (
          <button
            key={day.date}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setSelected(day.date)}
            className="flex w-9 flex-col items-center gap-1"
          >
            <span className="type-eyebrow text-[9px] text-muted-foreground">{day.label}</span>
            <span
              className={cn(
                "type-figure grid size-8 place-items-center rounded-full text-sm",
                isToday && "bg-[color:var(--job-today-fill)] text-[color:var(--job-today-on)]",
                isSelected &&
                  (isToday
                    ? "ring-2 ring-[color:var(--job-pick-line)] ring-offset-2 ring-offset-background"
                    : "ring-2 ring-inset ring-[color:var(--job-pick-line)]")
              )}
            >
              {day.date}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function monthCellStyle(mix: HueMix, isToday: boolean, isSelected: boolean): CSSProperties | undefined {
  if (!isToday && !isSelected) return undefined;
  return {
    ...(isToday && mix.today !== "identity" ? { "--gm-today": "var(--job-today-line)" } : null),
    ...jobAsPrimary(isSelected ? "pick" : "today", "line"),
  } as CSSProperties;
}

export function MonthGridSpecimen({ mix }: { mix: HueMix }) {
  const [selected, setSelected] = useState(13);
  const dates = Array.from({ length: 14 }, (_, index) => index + 5);
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-border">
      {dates.map((date) => {
        const isToday = date === TODAY;
        const isSelected = date === selected;
        return (
          <button
            key={date}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setSelected(date)}
            style={monthCellStyle(mix, isToday, isSelected)}
            className={cn(
              "flex min-h-16 flex-col gap-0.5 border-b border-r border-border/70 p-1 text-left",
              planMonthDaySurfaceClass({
                inMonth: true,
                isToday,
                isSelected,
                isPastInMonth: date < TODAY,
              })
            )}
          >
            <span className={cn("type-figure text-xs", planMonthDayNumberClass({ inMonth: true, isToday, isSelected }))}>
              {date}
            </span>
            {MONTH_PILLS[date]?.map((pill) => (
              <span
                key={pill.title}
                className="block truncate rounded-[4px] px-1 text-[10px] leading-4 text-foreground"
                style={categoryPillStyle(pill.category)}
              >
                {pill.title}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}

export function AgendaRowsSpecimen({ mix, rows = ROWS.length }: { mix: HueMix; rows?: number }) {
  const [selected, setSelected] = useState<string>(ROWS[1].id);
  const [done, setDone] = useState<Record<string, boolean>>({ run: true });
  const selectionStyle =
    mix.pick === "identity"
      ? undefined
      : ({
          "--gm-day-selected": "color-mix(in srgb, var(--job-pick-line) 14%, var(--background))",
        } as CSSProperties);
  return (
    <ul className="overflow-hidden rounded-lg border border-border bg-card" style={selectionStyle}>
      {ROWS.slice(0, rows).map((row) => {
        const isSelected = row.id === selected;
        return (
          <li
            key={row.id}
            className={cn(
              "flex items-center gap-3 border-b border-border/70 px-3 py-2.5 last:border-b-0",
              planSelectedWorkRowClass(isSelected)
            )}
            style={{ boxShadow: `inset 3px 0 0 ${goalCategoryPigment(goalCategoryColor(row.category))}` }}
          >
            <span style={jobAsPrimary("done", "line")}>
              <CompletionToggle
                size="sm"
                completed={Boolean(done[row.id])}
                aria-label={`Complete ${row.title}`}
                onClick={() => setDone((current) => ({ ...current, [row.id]: !current[row.id] }))}
              />
            </span>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(row.id)}
              className="min-w-0 flex-1 text-left"
            >
              <span className={cn("block truncate", planLedgerTitleClass)}>{row.title}</span>
              <span className={cn("block truncate text-xs", planLedgerSubtitleClass)}>{row.meta}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const PICKS = ["Morning run", "Portfolio", "Call Mom", "Budget"] as const;

export function PickersSpecimen() {
  const [featured, setFeatured] = useState<string[]>(["Portfolio"]);
  const [filters, setFilters] = useState({ tasks: true, done: false });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" style={jobAsPrimary("pick", "fill")}>
        {PICKS.map((pick) => {
          const on = featured.includes(pick);
          return (
            <button
              key={pick}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setFeatured((current) =>
                  on ? current.filter((item) => item !== pick) : [...current, pick]
                )
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"
              )}
            >
              {pick}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-sm" style={jobAsPrimary("pick", "line")}>
        {(
          [
            ["tasks", "Show tasks"],
            ["done", "Show completed"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={filters[key]}
              onChange={() => setFilters((current) => ({ ...current, [key]: !current[key] }))}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function ProgressSpecimen() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="type-item">Portfolio review</span>
        <span style={jobAsPrimary("done", "fill")}>
          <Badge>Completed</Badge>
        </span>
      </div>
      <div style={jobAsPrimary("done", "line")}>
        <Progress value={62} className="h-1.5" />
      </div>
      <p className="type-figure text-xs text-muted-foreground">3 of 5 this week · 62%</p>
    </div>
  );
}

export function ActionsSpecimen() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span style={jobAsPrimary("act", "fill")}>
        <Button>Save plan</Button>
      </span>
      <Button variant="outline">Cancel</Button>
      <span style={jobAsPrimary("act", "line")}>
        <Button variant="link">Add a milestone</Button>
      </span>
    </div>
  );
}

export function FocusSpecimen() {
  return (
    <div className="space-y-2" style={jobAsPrimary("focus", "line")}>
      <Input
        aria-label="Goal name (shown focused)"
        defaultValue="Morning run"
        className="border-ring ring-3 ring-ring/50"
      />
      <div className="plan-draft-shimmer rounded-md border border-primary/40 bg-primary/15 px-2 py-1.5 text-xs">
        Draft · Stretch 10 min · unsaved
      </div>
    </div>
  );
}
