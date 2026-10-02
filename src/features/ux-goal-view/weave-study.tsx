"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { CalendarPeek } from "./calendar-peek";
import { SessionEditor } from "./session-editor";
import { SessionTile } from "./session-tile";
import { dateLabel, isDone, shiftDate, weekOf } from "./model";
import { SAMPLE_GOALS, SAMPLE_THROUGH, SAMPLE_TODAY } from "./sample";
import { DraftBar, StudyChrome } from "./study-chrome";
import { useGoalViewStudy, type GoalViewStudySession } from "./use-study";
import { useStageWidth } from "./use-stage-width";
import { AXIS_END, AXIS_START } from "./weave-axis";
import { WeaveTimeline } from "./weave-timeline";
import "./study.css";
import "./weave.css";

export function WeekWeaveStudy() {
  const study = useGoalViewStudy();
  const stage = useStageWidth();
  const still = useReducedMotion();
  const [phone, setPhone] = useState(false);
  const [layout, setLayout] = useState<"weave" | "calendar">("weave");
  const [density, setDensity] = useState<"roomy" | "compact">("roomy");
  const [focusedId, setFocusedId] = useState("all");
  const [selectedDate, setSelectedDate] = useState(SAMPLE_TODAY);
  const [visibleDate, setVisibleDate] = useState(weekOf(SAMPLE_TODAY));
  const [requestedDate, setRequestedDate] = useState({ date: weekOf(SAMPLE_TODAY), revision: 0 });
  const mobile = phone || stage.width < 760;
  const dayWidth = density === "compact" ? 80 : mobile ? 104 : 128;
  const labelWidth = mobile ? 116 : 190;
  const goals = focusedId === "all" ? SAMPLE_GOALS : SAMPLE_GOALS.filter(g => g.id === focusedId);
  const navigate = (date: string) => {
    const boundedDate = date < AXIS_START ? AXIS_START : date > AXIS_END ? AXIS_END : date;
    setVisibleDate(boundedDate);
    setSelectedDate(boundedDate);
    setRequestedDate(current => ({ date: boundedDate, revision: current.revision + 1 }));
  };
  const visibleWeek = weekOf(visibleDate);
  return <StudyChrome week phone={phone} onPhoneChange={setPhone} onReset={() => { study.dispatch({ type: "reset" }); study.setEditingId(null); study.setCalendarDate(null); navigate(weekOf(SAMPLE_TODAY)); }} controls={<span className="tw-lab-caption">Time Weave · a configuration of Week view</span>}>
    <div className="gv-stage-wrap" data-phone={phone}><div className="gv-stage" ref={stage.ref}>
      <main className="gv-product tw-product">
        <div className="gv-product-header"><div><p className="gv-overline">Plan / week</p><h1 className="gv-display">{dateLabel(visibleWeek, "MMM d")} — {dateLabel(shiftDate(visibleWeek, 6), "MMM d")}</h1><p className="gv-intro">See how the week fits together. Make room as you go.</p></div><div className="tw-period-controls"><button className="gv-icon-button" aria-label="Previous week" disabled={visibleWeek <= AXIS_START} onClick={() => navigate(shiftDate(visibleWeek, -7))}><ArrowLeft size={18} /></button><button className="gv-button" onClick={() => { navigate(weekOf(SAMPLE_TODAY)); setSelectedDate(SAMPLE_TODAY); }}>Today</button><button className="gv-icon-button" aria-label="Next week" disabled={visibleWeek >= weekOf(AXIS_END)} onClick={() => navigate(shiftDate(visibleWeek, 7))}><ArrowRight size={18} /></button></div></div>
        <div className="gv-product-toolbar tw-toolbar">
          <div className="gv-segmented" role="group" aria-label="Week layout"><button aria-pressed={layout === "calendar"} onClick={() => setLayout("calendar")}>Calendar</button><button aria-pressed={layout === "weave"} onClick={() => { setRequestedDate(current => ({ date: visibleWeek, revision: current.revision + 1 })); setLayout("weave"); }}>Time Weave</button></div>
          <label className="tw-focus">Show<select aria-label="Focus a goal" value={focusedId} onChange={e => setFocusedId(e.target.value)}><option value="all">All goals</option>{SAMPLE_GOALS.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
          <label className="tw-jump"><CalendarDays size={14} /><span>Jump to</span><input aria-label="Jump to date" type="date" min={AXIS_START} max={AXIS_END} value={selectedDate} onChange={e => { const input = e.currentTarget; if (input.value && input.validity.valid) navigate(input.value); }} /></label>
          {layout === "weave" && <div className="gv-segmented" role="group" aria-label="Date density"><button aria-pressed={density === "roomy"} onClick={() => setDensity("roomy")}>Roomy</button><button aria-pressed={density === "compact"} onClick={() => setDensity("compact")}>Compact</button></div>}
        </div>
        <motion.div key={layout} initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .14 }} className="tw-layout-stage">
          {layout === "weave" ? <WeaveTimeline goals={goals} study={study} selectedDate={selectedDate} onSelectDate={setSelectedDate} requestedDate={requestedDate} dayWidth={dayWidth} labelWidth={labelWidth} onVisibleDate={setVisibleDate} onFocusGoal={id => setFocusedId(current => current === id ? "all" : id)} /> : <WeekColumns study={study} week={visibleWeek} goalId={focusedId} selectedDate={selectedDate} onSelectDate={setSelectedDate} />}
        </motion.div>
        {visibleDate > SAMPLE_THROUGH && <p className="tw-no-plan">You’re beyond the saved sample plan. Ongoing goals continue, but these dates don’t have saved sessions yet.</p>}
        <SelectedDay study={study} date={selectedDate} goalId={focusedId} />
        <DraftBar study={study} />
      </main>
    </div></div>
    <aside className="gv-study-notes"><p><strong>Time Weave lives under Week.</strong> A shared date axis reveals the spacing between goals. Scroll from September 2025 through October 2028; the saved sample sessions cover September 2026 through January 2027.</p><p>Try: swipe through several weeks; change Roomy to Compact while scrolled; jump to a month far away, then Today; drag Find your pace to Saturday; switch Calendar / Time Weave with a pending change; select Friday to see the day’s sessions in time order.</p><p>Native scrolling, a stable date axis, eight days of overscan, and motion only for local moves. Reduced motion removes the fades and date-move animation. Smoothness has not been measured or browser-verified.</p></aside>
    <SessionEditor study={study} /><CalendarPeek study={study} />
  </StudyChrome>;
}

function SelectedDay({ study, date, goalId }: { study: GoalViewStudySession; date: string; goalId: string }) {
  const sessions = study.state.sessions.filter(s => s.date === date && (goalId === "all" || s.goalId === goalId)).sort((a, b) => (a.time || "24:00").localeCompare(b.time || "24:00") || a.goalId.localeCompare(b.goalId));
  return <section className="tw-selected-day" aria-label="Selected day sessions">
    <div className="tw-agenda-heading"><div><p className="gv-overline">{date === SAMPLE_TODAY ? "Today" : "Selected date"}</p><h2 className="gv-display">{dateLabel(date, "EEEE, MMMM d")}</h2></div><p className="gv-muted">{sessions.length} scheduled · {sessions.filter(s => isDone(s, study.state.facts)).length} logged</p></div>
    {sessions.length ? <div className="tw-agenda-list gv-focused-panel">{sessions.map(s => <div className="tw-agenda-entry" key={s.id}><h3 className="gv-overline">{SAMPLE_GOALS.find(g => g.id === s.goalId)?.title}</h3><SessionTile session={s} study={study} /></div>)}</div> : <p className="gv-empty">No saved sessions for this date.</p>}
  </section>;
}

function WeekColumns({ study, week, goalId, selectedDate, onSelectDate }: { study: GoalViewStudySession; week: string; goalId: string; selectedDate: string; onSelectDate: (date: string) => void }) {
  return <div className="tw-calendar-board"><div className="gv-calendar-week">{Array.from({ length: 7 }, (_, i) => shiftDate(week, i)).map(date => <section key={date} data-today={date === SAMPLE_TODAY}><button className="tw-calendar-date" aria-label={`Inspect ${dateLabel(date, "EEEE, MMMM d, yyyy")}`} aria-pressed={date === selectedDate} onClick={() => onSelectDate(date)}><h3>{dateLabel(date, "EEE")}<strong>{dateLabel(date, "d")}</strong></h3></button>{study.state.sessions.filter(s => s.date === date && (goalId === "all" || s.goalId === goalId)).sort((a, b) => (a.time || "24:00").localeCompare(b.time || "24:00")).map(s => <button key={s.id} className="gv-calendar-entry" onClick={() => study.setEditingId(s.id)} style={{ borderLeftColor: SAMPLE_GOALS.find(g => g.id === s.goalId)?.color ?? undefined }}><small>{s.time || "Any time"}{isDone(s, study.state.facts) && " · logged"}</small><strong>{SAMPLE_GOALS.find(g => g.id === s.goalId)?.title}</strong><span>{s.name}</span></button>)}</section>)}</div></div>;
}
