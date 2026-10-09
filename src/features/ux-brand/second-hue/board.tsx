"use client";

import type { CSSProperties, ReactNode } from "react";
import { getTheme, type ThemeId } from "@cadence/shared/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hueBoardStyle, jobAsPrimary, type HueMix, type HuePalette } from "./model";
import {
  ActionsSpecimen,
  AgendaRowsSpecimen,
  AppTabsSpecimen,
  DraftTile,
  FocusSpecimen,
  InPageTabsSpecimen,
  MonthGridSpecimen,
  PickersSpecimen,
  ProgressSpecimen,
  Specimen,
  ViewSwitcherSpecimen,
  WeekStripSpecimen,
} from "./specimens";

interface BoardProps {
  themeId: ThemeId;
  mix: HueMix;
  palette: HuePalette;
}

/** The theme scope: `data-ui-style` and the hue variables sit on one element. */
function BoardFrame({ themeId, mix, palette, className, children }: BoardProps & { className?: string; children: ReactNode }) {
  return (
    <div
      data-ui-style={themeId}
      data-testid={`hue-board-${themeId}`}
      style={hueBoardStyle(mix, palette)}
      className={cn("rounded-2xl border border-border bg-page text-foreground shadow-sm", className)}
    >
      {children}
    </div>
  );
}

export function HueBoard(props: BoardProps) {
  const { themeId, mix } = props;
  const chrome = getTheme(themeId).tabChrome;
  return (
    <BoardFrame {...props} className="p-4 sm:p-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Specimen jobs={["place"]} title="App tabs, desktop">
            <AppTabsSpecimen chrome={chrome} mobile={false} />
          </Specimen>
          <Specimen jobs={["place"]} title="Planner toolbar">
            <div className="flex flex-wrap items-center gap-3">
              <ViewSwitcherSpecimen mix={mix} />
              <InPageTabsSpecimen mix={mix} variant="default" />
            </div>
          </Specimen>
          <Specimen jobs={["today", "pick"]} title="Month grid">
            <MonthGridSpecimen mix={mix} />
          </Specimen>
          <Specimen jobs={["place"]} title="Section tabs">
            <InPageTabsSpecimen mix={mix} variant="line" />
          </Specimen>
          <Specimen jobs={["act"]} title="Actions">
            <ActionsSpecimen />
          </Specimen>
        </div>
        <div className="space-y-6">
          <Specimen jobs={["today", "pick"]} title="Week strip">
            <WeekStripSpecimen />
          </Specimen>
          <Specimen jobs={["pick", "done"]} title="Agenda rows">
            <AgendaRowsSpecimen />
          </Specimen>
          <Specimen jobs={["pick"]} title="Pickers and filters">
            <PickersSpecimen />
          </Specimen>
          <Specimen jobs={["done"]} title="Progress">
            <ProgressSpecimen />
          </Specimen>
          <Specimen jobs={["focus", "draft"]} title="Editing">
            <FocusSpecimen />
          </Specimen>
          <Specimen jobs={["place"]} title="App tabs, phone">
            <AppTabsSpecimen chrome={chrome} mobile />
          </Specimen>
        </div>
      </div>
    </BoardFrame>
  );
}

const DRAFT_TILE = "plan-draft-shimmer rounded-md px-2 py-1.5 text-xs";

function DraftOption({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="type-eyebrow text-[9px] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

/** A committed session beside three draft treatments, for one theme. */
export function DraftComparison(props: BoardProps) {
  const { themeId, palette } = props;
  const accentLine = { "--primary": "var(--hue-accent-line)" } as CSSProperties;
  return (
    <BoardFrame {...props} className="space-y-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="type-heading text-base">{getTheme(themeId).label}</h3>
        <span style={jobAsPrimary("act", "fill")}>
          <Button size="sm">Save</Button>
        </span>
      </div>
      <div
        className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
        style={{ boxShadow: "inset 3px 0 0 var(--hue-identity)" }}
      >
        Morning run · 7:00 · committed
      </div>
      <DraftOption label="Identity · shipped">
        <div className={cn(DRAFT_TILE, "border border-primary/40 bg-primary/15")} style={{ "--primary": "var(--hue-identity)" } as CSSProperties}>
          Draft · Stretch 10 min · 7:30
        </div>
      </DraftOption>
      {palette.hasAccent ? (
        <DraftOption label="Accent · same treatment">
          <div className={cn(DRAFT_TILE, "border border-primary/40 bg-primary/15")} style={accentLine}>
            Draft · Stretch 10 min · 7:30
          </div>
        </DraftOption>
      ) : null}
      <DraftOption label={palette.hasAccent ? "Accent · marked" : "Identity · marked"}>
        <div
          className={cn(DRAFT_TILE, "flex items-center gap-2 border-[1.5px] border-dashed border-primary bg-primary/10")}
          style={accentLine}
        >
          <span className="rounded bg-[color:var(--hue-accent)] px-1.5 text-[10px] font-semibold text-[color:var(--hue-accent-on)]">
            Draft
          </span>
          Stretch 10 min · 7:30
        </div>
      </DraftOption>
    </BoardFrame>
  );
}

/** One phone-sized slice of the board, for comparing a mix across themes. */
export function HueBoardCompact(props: BoardProps) {
  const { themeId, mix } = props;
  const theme = getTheme(themeId);
  return (
    <BoardFrame {...props} className="space-y-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="type-heading text-base">{theme.label}</h3>
        <span style={jobAsPrimary("act", "fill")}>
          <Button size="sm">Save</Button>
        </span>
      </div>
      <WeekStripSpecimen />
      <AgendaRowsSpecimen rows={2} />
      <DraftTile />
      <ViewSwitcherSpecimen mix={mix} />
      <AppTabsSpecimen chrome={theme.tabChrome} mobile />
    </BoardFrame>
  );
}
