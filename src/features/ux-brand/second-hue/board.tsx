"use client";

import type { ReactNode } from "react";
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
