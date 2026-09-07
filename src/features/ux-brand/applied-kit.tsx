"use client";

import Link from "next/link";
import { useState } from "react";
import { NestMark } from "@/features/ux-brand/completion-marks";
import {
  BrandExploreBar,
  BrandPhone,
  BrandSpec,
} from "@/features/ux-brand/brand-stage";
import { RidgeSilhouette, StackMark } from "@/features/ux-brand/mix-kit";
import {
  COL_SKIN,
  GAZETTEER_SKIN,
  type BrandSkin,
} from "@/features/ux-brand/skins";
import {
  CONCEPT_MONTH_LABEL,
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
  itemsOnDate,
} from "@/features/ux-concepts/seed";
import { cn } from "@/lib/utils";

type KitMark = "nest" | "stack";
type KitRange = "week" | "month" | "day";
type KitShapeId = "square" | "paper" | "pill";

interface KitShape {
  id: KitShapeId;
  name: string;
  note: string;
  chip: string;
  stamp: string;
  control: string;
  row: string;
  card: string;
  cell: string;
  sheet: string;
  button: string;
  today: string;
  nest: string;
  tabs: "rule" | "pills";
  list: "rules" | "cards";
  gridGap: string;
}

const KIT_SHAPES: readonly KitShape[] = [
  {
    id: "square",
    name: "Square",
    note: "Dropped. Folio’s 0-radius lock. Hairline boxes. Newspaper signal.",
    chip: "0px",
    stamp: "0px",
    control: "0px",
    row: "0px",
    card: "0px",
    cell: "0px",
    sheet: "0px",
    button: "0px",
    today: "0px",
    nest: "0px",
    tabs: "rule",
    list: "rules",
    gridGap: "1px",
  },
  {
    id: "paper",
    name: "Soft paper",
    note: "Lock. Same Gazetteer type and cream. Corners like a notebook — not a 1998 browser, not a fully pill-shaped SaaS app.",
    chip: "8px",
    stamp: "4px",
    control: "10px",
    row: "12px",
    card: "14px",
    cell: "10px",
    sheet: "16px",
    button: "10px",
    today: "8px",
    nest: "4px",
    tabs: "rule",
    list: "rules",
    gridGap: "4px",
  },
  {
    id: "pill",
    name: "Pills",
    note: "Comparison only. Consumer-app geometry. Chips, range, and work tiles are capsules. Type and color stay.",
    chip: "999px",
    stamp: "8px",
    control: "999px",
    row: "999px",
    card: "20px",
    cell: "12px",
    sheet: "24px",
    button: "999px",
    today: "999px",
    nest: "6px",
    tabs: "pills",
    list: "cards",
    gridGap: "6px",
  },
];

const TABS = ["Plan", "Checklist", "Progress", "Community", "You"] as const;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const HEATMAP_SEED = new Set([
  "2026-08-30",
  "2026-08-31",
  "2026-09-02",
  "2026-09-03",
]);
const WEEK_ISOS = [
  "2026-08-30",
  "2026-08-31",
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
  "2026-09-05",
] as const;
const MONTH_ISOS = [
  "2026-08-30",
  "2026-08-31",
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
  "2026-09-05",
  "2026-09-06",
  "2026-09-07",
  "2026-09-08",
  "2026-09-09",
  "2026-09-10",
  "2026-09-11",
  "2026-09-12",
  "2026-09-13",
  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",
  "2026-09-19",
  "2026-09-20",
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",
  "2026-09-28",
  "2026-09-29",
  "2026-09-30",
  "2026-10-01",
  "2026-10-02",
  "2026-10-03",
  "2026-10-04",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
  "2026-10-10",
] as const;
const HEAT_ISOS = MONTH_ISOS.slice(0, 35);

function isoDay(iso: string) {
  return Number(iso.slice(8, 10));
}

function isoWeekday(iso: string) {
  const index = MONTH_ISOS.indexOf(iso as (typeof MONTH_ISOS)[number]);
  return index >= 0 ? index % 7 : 0;
}

function inSeptember(iso: string) {
  return iso.startsWith("2026-09");
}

function dateLabel(iso: string) {
  const month = Number(iso.slice(5, 7));
  const day = isoDay(iso);
  return `${WEEKDAY_SHORT[isoWeekday(iso)]}, ${MONTH_SHORT[month - 1]} ${day}`;
}

function MarkWrap({
  done,
  mark,
  skin,
}: {
  done: boolean;
  mark: KitMark;
  skin: BrandSkin;
}) {
  return (
    <span style={{ color: done ? skin.markDone : skin.markIdle }}>
      {mark === "nest" ? (
        <NestMark done={done} variant="nest" />
      ) : (
        <StackMark done={done} variant={skin.stackVariant} />
      )}
    </span>
  );
}

export function GazetteerKit() {
  return <AppliedKit skin={GAZETTEER_SKIN} />;
}

export function ColKit() {
  return <AppliedKit skin={COL_SKIN} />;
}

function AppliedKit({ skin }: { skin: BrandSkin }) {
  const [mark, setMark] = useState<KitMark>("nest");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Plan");
  const [range, setRange] = useState<KitRange>("week");
  const [selectedDate, setSelectedDate] = useState<string>(CONCEPT_TODAY);
  const [tempoDone, setTempoDone] = useState(false);
  const [heat, setHeat] = useState(() => new Set(HEATMAP_SEED));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shapeId, setShapeId] = useState<KitShapeId>("paper");
  const shape = KIT_SHAPES.find((item) => item.id === shapeId) ?? KIT_SHAPES[1];

  function isDone(id: string) {
    if (id === "tempo-run") return tempoDone;
    if (id === "deep-work") return true;
    return false;
  }

  function toggleRow(id: string) {
    if (id === "tempo-run") setTempoDone((value) => !value);
  }

  function toggleHeat(iso: string) {
    if (iso > CONCEPT_TODAY) return;
    setHeat((current) => {
      const next = new Set(current);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  const todayItems = itemsOnDate(CONCEPT_TODAY, null);
  const display = "font-[family-name:var(--font-brand-display)]";
  const mono = "font-[family-name:var(--font-brand-mono)]";

  return (
    <div className="min-h-dvh" style={{ background: skin.pageBg, color: skin.ink }}>
      <BrandExploreBar current={skin.id === "gazetteer" ? "kit-gazetteer" : "kit-col"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: skin.accent }}
        >
          {skin.kicker}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className={cn(display, "text-4xl font-semibold tracking-tight sm:text-5xl")}>
            {skin.name} kit
          </h1>
          <Link
            href={skin.otherHref}
            className="text-sm underline-offset-4 hover:underline"
            style={{ color: skin.accent }}
          >
            Open {skin.otherName}
          </Link>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-80">{skin.thesis}</p>
        <p className="mt-2 text-sm opacity-70">{skin.typeNote}</p>
        <p className="mt-2 max-w-2xl text-sm opacity-70">
          Spatial Plan IA is unchanged. Type and color stay. Soft paper is the
          corner lock — Square and Pills stay as a comparison, like Nest vs
          stack. Notes in{" "}
          <code className="text-[13px]">docs/ux/brand-lock-gazetteer-col.md</code>.
        </p>

        <div
          role="group"
          aria-label="Corner language"
          className="mt-6 inline-flex p-0.5 text-xs font-medium"
          style={{
            background: `${skin.ink}14`,
            borderRadius: shape.control,
          }}
        >
          {KIT_SHAPES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={shapeId === item.id}
              onClick={() => setShapeId(item.id)}
              className="min-h-8 px-3"
              style={{
                borderRadius: shape.control,
                ...(shapeId === item.id
                  ? { background: skin.paper, color: skin.accent }
                  : { color: skin.muted }),
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className="mt-2 max-w-xl text-sm opacity-70">{shape.note}</p>

        <div
          role="group"
          aria-label="Completion mark"
          className="mt-4 inline-flex p-0.5 text-xs font-medium"
          style={{
            background: `${skin.ink}14`,
            borderRadius: shape.control,
          }}
        >
          {(["nest", "stack"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mark === value}
              onClick={() => setMark(value)}
              className="min-h-8 px-3 capitalize"
              style={{
                borderRadius: shape.control,
                ...(mark === value
                  ? { background: skin.paper, color: skin.accent }
                  : { color: skin.muted }),
              }}
            >
              {value === "nest" ? "Nest" : "Rectangular stack"}
            </button>
          ))}
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className={cn(display, "text-2xl tracking-tight")}>Marks</h2>
            <p className="mt-1 text-sm opacity-70">
              Nest is the lock. Stack is the runner-up. Sleeve, seal, and the
              rest are not in this kit.
            </p>
            <div className="mt-4 flex gap-8" style={{ color: skin.accent }}>
              <BrandSpec title="Idle / done · nest">
                <div className="flex gap-4">
                  <NestMark done={false} variant="nest" />
                  <NestMark done variant="nest" />
                </div>
              </BrandSpec>
              <BrandSpec title="Idle / done · stack">
                <div className="flex gap-4">
                  <StackMark done={false} variant={skin.stackVariant} />
                  <StackMark done variant={skin.stackVariant} />
                </div>
              </BrandSpec>
            </div>
          </div>
          <div>
            <h2 className={cn(display, "text-2xl tracking-tight")}>Chips and stamp</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {["Health", "Career", "Relationships"].map((label) => (
                <span
                  key={label}
                  className="border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    borderColor: skin.rule,
                    color: skin.muted,
                    borderRadius: shape.chip,
                  }}
                >
                  {label}
                </span>
              ))}
              <span
                className="inline-block -rotate-6 border-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  borderColor: skin.accent,
                  color: skin.accent,
                  borderRadius: shape.stamp,
                }}
              >
                Thu 3 Sep
              </span>
              <span
                className={cn(mono, "text-xs")}
                style={{ color: skin.gain }}
              >
                +240 m
              </span>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className={cn(display, "text-2xl tracking-tight")}>Tabs and range</h2>
          {shape.tabs === "pills" ? (
            <nav
              aria-label="Destinations"
              className="mt-4 grid grid-cols-5 gap-1 p-1"
              style={{
                background: `${skin.ink}12`,
                borderRadius: shape.control,
              }}
            >
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className="min-h-10 text-[11px] font-medium uppercase tracking-[0.12em]"
                  style={{
                    borderRadius: shape.control,
                    color: tab === item ? skin.ink : skin.muted,
                    background: tab === item ? skin.paper : undefined,
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          ) : (
            <nav
              aria-label="Destinations"
              className="mt-4 grid grid-cols-5 gap-1 border-b pb-1"
              style={{ borderColor: skin.rule }}
            >
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className="min-h-10 text-[11px] font-medium uppercase tracking-[0.12em]"
                  style={{
                    color: tab === item ? skin.accent : skin.muted,
                    boxShadow: tab === item ? `inset 0 -2px 0 ${skin.accent}` : undefined,
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          )}
          <div
            role="group"
            aria-label="Calendar range"
            className="mt-4 inline-flex p-0.5 text-xs"
            style={{
              background: `${skin.ink}12`,
              borderRadius: shape.control,
            }}
          >
            {(["week", "month", "day"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                onClick={() => setRange(value)}
                className="min-h-8 px-3 capitalize"
                style={{
                  borderRadius: shape.control,
                  ...(range === value
                    ? { background: skin.paper, color: skin.ink }
                    : { color: skin.muted }),
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className={cn(display, "text-2xl tracking-tight")}>Work pills</h2>
            <p className="mt-1 text-sm opacity-70">
              Plan week. Pills move later. Completing does not live here.
            </p>
            <div className={cn("mt-4 max-w-md", shape.list === "cards" ? "space-y-2" : "space-y-1.5")}>
              {todayItems.map((item) => {
                const done = isDone(item.id);
                const unplaced = item.id === "strength";
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
                    style={{
                      border: `1px solid ${unplaced ? skin.recover : skin.rule}`,
                      background: done ? `${skin.ink}08` : skin.paper,
                      borderRadius: shape.row,
                    }}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: unplaced ? skin.recover : skin.accent }}
                    />
                    <span className={cn("min-w-0 flex-1 truncate text-sm", display, done && "opacity-50")}>
                      {item.title}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: skin.muted }}>
                      {unplaced ? "unplaced" : item.cadence}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              className="mt-4 border px-3 py-2 text-sm"
              style={{
                borderColor: skin.recover,
                color: skin.recover,
                borderRadius: shape.card,
              }}
            >
              1 unplaced · Strength needs a day. Recover is replanning.
            </div>
          </div>

          <div>
            <h2 className={cn(display, "text-2xl tracking-tight")}>Work rows</h2>
            <p className="mt-1 text-sm opacity-70">
              Day view and Checklist. Complete lives here. Tap Tempo run.
            </p>
            <ul className={cn("mt-4 max-w-md", shape.list === "cards" && "space-y-2")}>
              {todayItems.map((item) => {
                const done = isDone(item.id);
                return (
                  <li
                    key={item.id}
                    style={
                      shape.list === "cards"
                        ? {
                            border: `1px solid ${skin.rule}`,
                            borderRadius: shape.card,
                            paddingInline: "0.75rem",
                            background: skin.paper,
                          }
                        : { borderBottom: `1px solid ${skin.rule}` }
                    }
                  >
                    <button
                      type="button"
                      onClick={() => toggleRow(item.id)}
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <MarkWrap done={done} mark={mark} skin={skin} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[15px] leading-none", display)}>
                          {item.title}
                        </span>
                        <span
                          className="mt-1 block text-[11px] uppercase tracking-[0.12em]"
                          style={{ color: skin.muted }}
                        >
                          {item.category} · {item.cadence}
                        </span>
                      </span>
                      <span className={cn(mono, "text-xs")} style={{ color: skin.gain }}>
                        {item.id === "tempo-run"
                          ? "+240 m"
                          : item.id === "launch-notes"
                            ? "+80 m"
                            : item.id === "weekly-reset"
                              ? "+40 m"
                              : "+120 m"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className={cn(display, "text-2xl tracking-tight")}>Month grid</h2>
          <p className="mt-1 text-sm opacity-70">
            Tap a day. Completing still does not live on the month cell.
          </p>
          <div className="mt-4 max-w-xl">
            <div
              className="grid grid-cols-7 gap-px text-center text-[11px]"
              style={{ color: skin.muted }}
            >
              {WEEKDAYS.map((label, index) => (
                <div key={`${label}-${index}`} className="py-1">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7" style={{ gap: shape.gridGap }}>
              {MONTH_ISOS.map((iso) => {
                const inMonth = inSeptember(iso);
                const selected = iso === selectedDate;
                const isToday = iso === CONCEPT_TODAY;
                const missed = iso === STRENGTH_MISSED_DATE;
                const dots = itemsOnDate(iso, null);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(iso);
                      setRange("day");
                    }}
                    className="flex min-h-[3.2rem] flex-col items-center px-0.5 py-1 text-xs"
                    style={{
                      opacity: inMonth ? 1 : 0.35,
                      background: missed && !selected ? `${skin.recover}18` : selected ? `${skin.accent}14` : undefined,
                      boxShadow: selected ? `inset 0 0 0 1px ${skin.accent}` : undefined,
                      borderRadius: shape.cell,
                    }}
                  >
                    <span
                      className="flex size-6 items-center justify-center"
                      style={{
                        background: isToday ? skin.accent : undefined,
                        color: isToday ? skin.paper : undefined,
                        borderRadius: shape.today,
                      }}
                    >
                      {isoDay(iso)}
                    </span>
                    <span className="mt-1 flex gap-0.5">
                      {dots.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="size-1 rounded-full"
                          style={{ background: skin.accent }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className={cn(display, "text-2xl tracking-tight")}>Goal heatmap</h2>
          <p className="mt-1 max-w-xl text-sm opacity-70">
            Progress ledger, not Plan. Tap a past day or today. Future days stay
            closed. Filled cells use Nest logic: the inner square occupies the
            day.
          </p>
          <div className="mt-4 max-w-md">
            <p className={cn(display, "text-lg")}>Tempo run</p>
            <p className="text-sm opacity-70">
              {heat.size} of 12 logged in {CONCEPT_MONTH_LABEL}.
            </p>
            <div
              className="mt-3 grid grid-cols-7 gap-px text-center text-[11px]"
              style={{ color: skin.muted }}
            >
              {WEEKDAYS.map((label, index) => (
                <div key={`h-${label}-${index}`} className="py-1">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1" aria-label="Goal completion heatmap">
              {HEAT_ISOS.map((iso) => {
                const inMonth = inSeptember(iso);
                const completed = heat.has(iso);
                const future = iso > CONCEPT_TODAY;
                const isToday = iso === CONCEPT_TODAY;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => toggleHeat(iso)}
                    disabled={future}
                    aria-pressed={completed}
                    aria-label={`${dateLabel(iso)}${completed ? ", completed" : ""}`}
                    className="flex min-h-[2.6rem] flex-col items-center py-1 text-xs"
                    style={{
                      opacity: future ? 0.35 : inMonth ? 1 : 0.4,
                      boxShadow: isToday ? `inset 0 0 0 1px ${skin.accent}` : undefined,
                      borderRadius: shape.cell,
                    }}
                  >
                    <span>{isoDay(iso)}</span>
                    <span
                      className="mt-1 grid size-3.5 place-items-center border"
                      style={{
                        borderColor: skin.markIdle,
                        color: skin.markDone,
                        borderRadius: shape.nest,
                      }}
                    >
                      {completed ? (
                        <span
                          className="block size-2"
                          style={{ background: "currentColor", borderRadius: shape.nest }}
                        />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className={cn(display, "text-2xl tracking-tight")}>Sheet</h2>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-3 min-h-10 border px-4 text-sm"
            style={{
              borderColor: skin.accent,
              color: skin.accent,
              borderRadius: shape.button,
            }}
          >
            Open Coach sheet
          </button>
          {sheetOpen ? (
            <div
              className="mt-4 max-w-md border p-4"
              style={{
                borderColor: skin.rule,
                background: skin.paper,
                borderRadius: shape.sheet,
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: skin.accent }}
              >
                Coach
              </p>
              <p className={cn(display, "mt-2 text-2xl leading-none")}>
                Move Strength to Thursday?
              </p>
              <p className="mt-2 text-sm opacity-70">
                One job. Sheets propose. They do not complete the row.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="min-h-9 px-3 text-sm text-white"
                  style={{ background: skin.accent, borderRadius: shape.button }}
                >
                  Place it
                </button>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="min-h-9 px-3 text-sm"
                  style={{ color: skin.muted, borderRadius: shape.button }}
                >
                  Not now
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-2">
          <BrandPhone label={`Plan week · ${skin.name} · ${shape.name}`}>
            <PlanPhone
              skin={skin}
              mark={mark}
              shape={shape}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              isDone={isDone}
              display={display}
            />
          </BrandPhone>
          <BrandPhone label={`Progress heatmap · ${skin.name} · ${shape.name}`}>
            <ProgressPhone
              skin={skin}
              shape={shape}
              heat={heat}
              onToggle={toggleHeat}
              display={display}
            />
          </BrandPhone>
        </section>
      </main>
    </div>
  );
}

function PlanPhone({
  skin,
  mark,
  shape,
  selectedDate,
  onSelectDate,
  isDone,
  display,
}: {
  skin: BrandSkin;
  mark: KitMark;
  shape: KitShape;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  isDone: (id: string) => boolean;
  display: string;
}) {
  return (
    <div className="relative min-h-[640px] overflow-hidden pb-8" style={{ color: skin.ink }}>
      {skin.sky ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 78% 10%, rgba(247,236,214,0.9), transparent 34%), linear-gradient(180deg, #e7eef2 0%, #f4f1ea 46%, #e8dfd2 100%)",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: skin.paper }} />
      )}
      {skin.sky ? <RidgeSilhouette className="text-[#b7c4b8]" /> : null}
      <div className="relative px-5 pt-4">
        <div
          className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.16em]"
          style={{ color: skin.muted }}
        >
          <span>{skin.name}</span>
          <span>Week 36</span>
        </div>
        <h2 className={cn(display, "mt-3 text-[2.1rem] leading-none tracking-tight")}>
          This week
        </h2>
        <p className="mt-2 text-sm opacity-70">Aug 30 – Sep 5 · pills you can drag later</p>
        <ol className={cn("mt-4", shape.list === "cards" && "space-y-2")}>
          {WEEK_ISOS.map((iso) => {
            const selected = iso === selectedDate;
            const isToday = iso === CONCEPT_TODAY;
            const missed = iso === STRENGTH_MISSED_DATE;
            const items = itemsOnDate(iso, null);
            return (
              <li
                key={iso}
                className="flex items-start gap-2 py-2.5"
                style={{
                  borderBottom:
                    shape.list === "rules" ? `1px solid ${skin.rule}` : undefined,
                  background: missed ? `${skin.recover}14` : selected ? `${skin.accent}10` : undefined,
                  borderRadius: shape.list === "cards" ? shape.card : undefined,
                  paddingInline: shape.list === "cards" ? "0.5rem" : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(iso)}
                  className="w-12 shrink-0 text-left"
                >
                  <span
                    className="block text-[10px] uppercase tracking-[0.12em]"
                    style={{ color: skin.muted }}
                  >
                    {WEEKDAY_SHORT[isoWeekday(iso)]}
                  </span>
                  <span
                    className={cn(display, "mt-0.5 inline-flex size-7 items-center justify-center text-base")}
                    style={
                      isToday
                        ? {
                            background: skin.accent,
                            color: skin.paper,
                            borderRadius: shape.today,
                          }
                        : {
                            color: selected ? skin.accent : skin.ink,
                            borderRadius: shape.today,
                          }
                    }
                  >
                    {isoDay(iso)}
                  </span>
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  {items.length === 0 ? (
                    <p className="text-sm opacity-50">No work this day</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-2 py-1 text-sm"
                        style={{
                          border: `1px solid ${skin.rule}`,
                          background: skin.paper,
                          borderRadius: shape.row,
                        }}
                      >
                        <MarkWrap done={isDone(item.id)} mark={mark} skin={skin} />
                        <span className={cn("truncate", display)}>{item.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function ProgressPhone({
  skin,
  shape,
  heat,
  onToggle,
  display,
}: {
  skin: BrandSkin;
  shape: KitShape;
  heat: Set<string>;
  onToggle: (iso: string) => void;
  display: string;
}) {
  return (
    <div className="relative min-h-[640px] overflow-hidden pb-8" style={{ color: skin.ink }}>
      {skin.sky ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 78% 10%, rgba(247,236,214,0.9), transparent 34%), linear-gradient(180deg, #e7eef2 0%, #f4f1ea 46%, #e8dfd2 100%)",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: skin.paper }} />
      )}
      {skin.sky ? <RidgeSilhouette className="text-[#b7c4b8]" /> : null}
      <div className="relative px-5 pt-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: skin.accent }}
        >
          Ledger
        </p>
        <h2 className={cn(display, "mt-1 text-[2.1rem] leading-none tracking-tight")}>
          Tempo run
        </h2>
        <p className="mt-2 text-sm opacity-70">
          {heat.size} of 12 in September. Tap a day to log.
        </p>
        <div
          className="mt-4 grid grid-cols-7 gap-px text-center text-[10px]"
          style={{ color: skin.muted }}
        >
          {WEEKDAYS.map((label, index) => (
            <div key={`p-${label}-${index}`}>{label}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {HEAT_ISOS.map((iso) => {
            const completed = heat.has(iso);
            const future = iso > CONCEPT_TODAY;
            return (
              <button
                key={iso}
                type="button"
                disabled={future}
                onClick={() => onToggle(iso)}
                aria-label={`${dateLabel(iso)}${completed ? ", completed" : ""}`}
                className="flex min-h-[2.4rem] flex-col items-center py-1 text-[11px]"
                style={{ opacity: future ? 0.3 : 1, borderRadius: shape.cell }}
              >
                {isoDay(iso)}
                <span
                  className="mt-1 grid size-3 place-items-center border"
                  style={{
                    borderColor: skin.markIdle,
                    color: skin.markDone,
                    borderRadius: shape.nest,
                  }}
                >
                  {completed ? (
                    <span
                      className="block size-1.5"
                      style={{ background: "currentColor", borderRadius: shape.nest }}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
