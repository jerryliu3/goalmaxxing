"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  CircleUser,
  ListChecks,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CONCEPT_PARTNER_NAME,
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
  type ConceptItem,
  type ConceptTone,
} from "@/features/ux-concepts/seed";
import {
  itemKindLabel,
  type ConceptHomeTab,
  type ConceptSession,
} from "@/features/ux-concepts/use-concept-session";

export const TONE_DOT: Record<ConceptTone, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
};

export const TONE_PILL: Record<ConceptTone, string> = {
  blue: "bg-blue-50 ring-blue-200/70",
  emerald: "bg-emerald-50 ring-emerald-200/70",
  violet: "bg-violet-50 ring-violet-200/70",
  amber: "bg-amber-50 ring-amber-200/80",
};

const TAB_META: Record<
  ConceptHomeTab,
  { label: string; icon: typeof ListChecks }
> = {
  today: { label: "Today", icon: ListChecks },
  plan: { label: "Plan", icon: CalendarDays },
  checklist: { label: "Checklist", icon: ListChecks },
  progress: { label: "Progress", icon: TrendingUp },
  community: { label: "Community", icon: Users },
  you: { label: "You", icon: CircleUser },
};

export function ConceptExploreBar({
  direction,
  title,
  locked = false,
}: {
  direction: "A" | "B" | "C";
  title: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-3 py-2 text-xs text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground">
          {locked ? `Locked direction ${direction}` : `Concept ${direction}`}
        </span>
        <span className="mx-1.5">·</span>
        {title}
        <span className="mx-1.5">·</span>
        Exploratory, not production
      </p>
      <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/ux/concepts">
        Gallery
      </Link>
    </div>
  );
}

export function ConceptAppTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: ConceptHomeTab[];
  active: ConceptHomeTab;
  onChange: (tab: ConceptHomeTab) => void;
}) {
  return (
    <nav
      aria-label="Concept destinations"
      className="grid gap-1 rounded-[1.35rem] border border-border/40 bg-background/80 p-1.5 shadow-sm backdrop-blur-md"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const meta = TAB_META[tab];
        const Icon = meta.icon;
        const selected = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center rounded-xl px-1 py-1 text-[11px] font-medium touch-manipulation",
              selected ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
            aria-current={selected ? "page" : undefined}
          >
            <Icon className="size-4" />
            {meta.label}
          </button>
        );
      })}
    </nav>
  );
}

export function WorkPill({
  item,
  completed,
  unplaced = false,
  onClick,
}: {
  item: ConceptItem;
  completed: boolean;
  unplaced?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onClick={onClick}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/goalmaxxing-item", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "flex w-full cursor-grab items-center gap-2 rounded-lg px-2.5 py-1.5 text-left ring-1 touch-manipulation active:cursor-grabbing",
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
    </button>
  );
}

export function GoalRow({
  item,
  completed,
  onToggle,
  onOpen,
  dimmed,
}: {
  item: ConceptItem;
  completed: boolean;
  onToggle: () => void;
  onOpen: () => void;
  dimmed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0",
        dimmed && "opacity-55"
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
    </div>
  );
}

export function RecoverBanner({
  recovered,
  onOpen,
}: {
  recovered: boolean;
  onOpen: () => void;
}) {
  if (recovered) {
    return (
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        Strength is on Thursday. Replanning stayed in the plan — nothing was
        invented as complete.
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-left touch-manipulation"
    >
      <span className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
      <span>
        <span className="block text-sm font-semibold text-amber-950">
          Adapt Strength from Tuesday
        </span>
        <span className="block text-xs text-amber-900/80">
          One session is unplaced. Recover moves it — it does not mark it done.
        </span>
      </span>
    </button>
  );
}

export function PartnerPulse({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">
        {CONCEPT_PARTNER_NAME} completed Yoga
      </p>
    );
  }
  return (
    <div className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-950">
      <p className="font-medium">{CONCEPT_PARTNER_NAME} completed Yoga</p>
      <p className="text-xs text-violet-900/70">Duo overlay — not a feed.</p>
    </div>
  );
}

export function FabNewGoal({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      size="icon-lg"
      className="size-12 rounded-full shadow-md"
      onClick={onClick}
      aria-label="New goal"
    >
      <Plus className="size-5" />
    </Button>
  );
}

export function CoachButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      <Sparkles className="size-4" />
      Coach
    </Button>
  );
}

export function ConceptSheets({ session }: { session: ConceptSession }) {
  const item = session.selectedItem;
  return (
    <>
      <Dialog
        open={item !== null}
        onOpenChange={(open) => {
          if (!open) {
            session.setSelectedItemId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{item?.title ?? "Item"}</DialogTitle>
            <DialogDescription>
              {item ? `${itemKindLabel(item)} · ${item.cadence} · ${item.category}` : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {item?.note ??
              "Prototype detail sheet. Production would show progress, history, and edit."}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => session.setSelectedItemId(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={session.recoverOpen} onOpenChange={session.setRecoverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recover Strength</DialogTitle>
            <DialogDescription>
              Tuesday’s session is unplaced. This is replanning, not a miss to
              be ashamed of.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Move Strength to{" "}
            {format(
              parseISO(
                session.selectedDate === STRENGTH_MISSED_DATE
                  ? CONCEPT_TODAY
                  : session.selectedDate
              ),
              "EEEE"
            )}
            ? It stays incomplete until you mark it.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => session.setRecoverOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                session.recoverStrengthToDate(
                  session.selectedDate === STRENGTH_MISSED_DATE
                    ? CONCEPT_TODAY
                    : session.selectedDate
                )
              }
            >
              Move to this day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={session.coachOpen} onOpenChange={session.setCoachOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Coach proposal</DialogTitle>
            <DialogDescription>
              A proposal you review. Not unreviewed autonomy.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Shift Strength onto Thursday so the week still has two health
            sessions. You can accept, edit, or dismiss.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => session.setCoachOpen(false)}
            >
              Dismiss
            </Button>
            <Button
              type="button"
              onClick={() => {
                session.recoverStrengthToToday();
                session.setCoachOpen(false);
              }}
            >
              Accept proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={session.newGoalOpen} onOpenChange={session.setNewGoalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
            <DialogDescription>
              Capture lives in the thumb zone in these concepts. This sheet is
              a prototype stand-in.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Production would open the existing goal editor. Keyboard: N.
          </p>
          <DialogFooter>
            <Button type="button" onClick={() => session.setNewGoalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HintPanel({
  tab,
  children,
}: {
  tab: ConceptHomeTab;
  children?: ReactNode;
}) {
  const copy: Record<ConceptHomeTab, string> = {
    today: "Today is a list of this date’s goals and tasks.",
    plan: "Plan is week, month, and day. Day is the checklist. Show unplanned keeps items that were never placed.",
    checklist:
      "Written lock: Day is the checklist. This tab is leftover in the sketch.",
    progress:
      "Progress is the goal ledger. Written lock: aggregate by default, one goal editable, multi-select overlap. This sketch is one goal.",
    community:
      "Community keeps Team, Challenges, and Leaderboards. Duo is a platform mode on Plan.",
    you: "You is identity at the top, then grouped product controls.",
  };
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-6">
      <h2 className="text-lg font-semibold tracking-tight">{TAB_META[tab].label}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{copy[tab]}</p>
      {children}
    </div>
  );
}

export function DesktopKeyHint() {
  return (
    <p className="hidden text-xs text-muted-foreground md:block">
      Keyboard: J/K dates · N new · Esc close
    </p>
  );
}

export function DuoModeToggle({
  mode,
  onChange,
}: {
  mode: "solo" | "duo";
  onChange: (mode: "solo" | "duo") => void;
}) {
  return (
    <div
      role="group"
      aria-label="Duo mode"
      className="inline-flex rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(["solo", "duo"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            "min-h-8 rounded-full px-3 capitalize touch-manipulation",
            mode === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {value === "solo" ? "Solo" : "Duo"}
        </button>
      ))}
    </div>
  );
}
