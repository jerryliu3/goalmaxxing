"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  Heading,
  Panel,
  Search,
  Segments,
  StudyDialog,
} from "../primitives";
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { sampleDayLabel } from "../sample";
import { DayWork, WeekStrip, toggleId } from "./work";

export function AgendaConcept({ variant }: { variant: number }) {
  const [view, setView] = useState("Day");
  const [day, setDay] = useState(8);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [filters, setFilters] = useState(false);
  const [searching, setSearching] = useState(variant === 1);
  const [completed, setCompleted] = useState<string[]>(["language-6"]);
  const work = (
    <Panel>
      <DayWork
        day={day}
        query={query}
        category={category}
        completed={completed}
        onToggle={(id) => setCompleted(toggleId(completed, id))}
      />
    </Panel>
  );
  return (
    <>
      <AppNav />
      <div className="rf-canvas">
        <Heading eyebrow="Thursday, October 8" title="Agenda">
          <div className="rf-actions">
            <Action variant="outline" asChild>
              <a href="/ux/refresh/recovery-actions">
                Review 2 slipped sessions
                <ArrowRight aria-hidden size={16} />
              </a>
            </Action>
          </div>
        </Heading>
        <div className="rf-toolbar">
          <Segments
            label="Agenda view"
            values={["Day", "Week"]}
            value={view}
            onChange={setView}
          />
          <div>
            <Action
              variant="ghost"
              onClick={() => setSearching(!searching)}
              aria-expanded={searching}
            >
              Search
            </Action>
            <Action variant="outline" onClick={() => setFilters(true)}>
              <SlidersHorizontal aria-hidden size={16} />
              Filters{category !== "All" ? " · 1" : ""}
            </Action>
          </div>
        </div>
        {searching && (
          <div className="mb-6">
            <Search value={query} onChange={setQuery} />
          </div>
        )}
        {view === "Week" && <WeekStrip selected={day} onSelect={setDay} />}
        {variant === 0 ? (
          <>
            <div className="rf-row mb-5">
              <div className="rf-actions">
                <Action
                  variant="ghost"
                  aria-label="Previous sample day"
                  disabled={day <= 5}
                  onClick={() => setDay(day - 1)}
                >
                  <ChevronLeft aria-hidden size={16} />
                </Action>
                <span className="type-figure">{sampleDayLabel(day)}</span>
                <Action
                  variant="ghost"
                  aria-label="Next sample day"
                  disabled={day >= 11}
                  onClick={() => setDay(day + 1)}
                >
                  <ChevronRight aria-hidden size={16} />
                </Action>
              </div>
              <Action variant="ghost" onClick={() => setDay(8)}>
                Today
              </Action>
            </div>
            {work}
          </>
        ) : (
          <div className="rf-spine">
            <aside className="rf-date-spine">
              <span className="type-eyebrow">October</span>
              <strong className="type-stat">{day}</strong>
              <span className="rf-muted">
                {day === 8 ? "Today" : sampleDayLabel(day).split(",")[0]}
              </span>
              <Action variant="ghost" onClick={() => setDay(8)}>
                Today
              </Action>
            </aside>
            {work}
          </div>
        )}
        <StudyDialog
          open={filters}
          onOpenChange={setFilters}
          title="Filter your agenda"
          description="Narrow the work without adding another toolbar row."
          footer={
            <>
              <Action
                variant="outline"
                onClick={() => {
                  setCategory("All");
                  setQuery("");
                }}
              >
                Clear filters
              </Action>
              <Action onClick={() => setFilters(false)}>Show agenda</Action>
            </>
          }
        >
          <label className="rf-field">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>All</option>
              <option>Health</option>
              <option>Personal</option>
              <option>Career</option>
            </select>
          </label>
          <p className="rf-muted">
            {category === "All" ? "All categories" : category} ·{" "}
            {query ? `Search: ${query}` : "No search filter"}
          </p>
        </StudyDialog>
      </div>
    </>
  );
}
