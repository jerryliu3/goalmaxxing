"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarPeek } from "./calendar-peek";
import { SessionEditor } from "./session-editor";
import { dateLabel, shiftDate, weekOf } from "./model";
import { SAMPLE_GOALS, SAMPLE_THROUGH, SAMPLE_TODAY } from "./sample";
import { DraftBar, StudyChrome } from "./study-chrome";
import { useGoalViewStudy } from "./use-study";
import { useStageWidth } from "./use-stage-width";
import { AXIS_END, AXIS_START } from "./weave-axis";
import { WeaveTimeline } from "./weave-timeline";
import { WeaveWeekAgenda } from "./weave-week-agenda";
import { WeaveDayInspector } from "./weave-day-inspector";
import { useWeaveNavigation } from "./use-weave-navigation";
import "./study.css";
import "./weave.css";

export function WeekWeaveStudy() {
  const study = useGoalViewStudy();
  const stage = useStageWidth();
  const navigation = useWeaveNavigation();
  const still = useReducedMotion();
  const [phone, setPhone] = useState(false);
  const [layout, setLayout] = useState<"weave" | "calendar">("weave");
  const [density, setDensity] = useState<"roomy" | "compact">("roomy");
  const [focusedId, setFocusedId] = useState("all");
  const mobile = phone || stage.width < 760;
  const dayWidth = density === "compact" ? 80 : mobile ? 104 : 128;
  const labelWidth = mobile ? 116 : 190;
  const goals = focusedId === "all" ? SAMPLE_GOALS : SAMPLE_GOALS.filter(g => g.id === focusedId);
  const visibleWeek = weekOf(navigation.visibleDate);
  const changeLayout = (next: "weave" | "calendar") => {
    if (next === layout) return;
    if (next === "weave") navigation.navigate(navigation.visibleDate);
    navigation.setInspectedDate(null);
    setLayout(next);
  };
  return <StudyChrome week phone={phone} onPhoneChange={setPhone} onReset={() => {
    study.dispatch({ type: "reset" }); study.setEditingId(null); study.setCalendarDate(null);
    setFocusedId("all"); navigation.navigate(weekOf(SAMPLE_TODAY)); navigation.setSelectedDate(SAMPLE_TODAY);
  }} controls={<span className="tw-lab-caption">Week placement · compare with Time Weave in Goal View</span>}>
    <div className="gv-stage-wrap" data-phone={phone}><div className="gv-stage" ref={stage.ref}>
      <main className="gv-product tw-product">
        <div className="gv-product-header">
          <div><p className="gv-overline">Plan / week</p><h1 className="gv-display">{dateLabel(visibleWeek, "MMM d")} — {dateLabel(shiftDate(visibleWeek, 6), "MMM d")}</h1><p className="gv-intro">See how the week fits together. Make room as you go.</p></div>
          <div className="tw-period-controls">
            <button className="gv-icon-button" aria-label="Previous week" disabled={visibleWeek <= AXIS_START} onClick={() => navigation.navigate(shiftDate(visibleWeek, -7))}><ArrowLeft size={18} /></button>
            <button className="gv-button" onClick={() => { navigation.navigate(weekOf(SAMPLE_TODAY)); navigation.setSelectedDate(SAMPLE_TODAY); }}>Today</button>
            <button className="gv-icon-button" aria-label="Next week" disabled={visibleWeek >= weekOf(AXIS_END)} onClick={() => navigation.navigate(shiftDate(visibleWeek, 7))}><ArrowRight size={18} /></button>
          </div>
        </div>
        <div className="gv-product-toolbar tw-toolbar">
          <div className="gv-segmented" role="group" aria-label="Week layout">
            <button aria-pressed={layout === "calendar"} onClick={() => changeLayout("calendar")}>Week agenda</button>
            <button aria-pressed={layout === "weave"} onClick={() => changeLayout("weave")}>Time Weave</button>
          </div>
          <label className="tw-focus">Show<select aria-label="Focus a goal" value={focusedId} onChange={e => setFocusedId(e.target.value)}><option value="all">All goals</option>{SAMPLE_GOALS.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
          <label className="tw-jump"><CalendarDays size={14} /><span>Jump to</span><input aria-label="Jump to date" type="date" min={AXIS_START} max={AXIS_END} value={navigation.selectedDate} onChange={e => { const input = e.currentTarget; if (input.value && input.validity.valid) navigation.navigate(input.value); }} /></label>
          {layout === "weave" && <div className="gv-segmented" role="group" aria-label="Date density"><button aria-pressed={density === "roomy"} onClick={() => setDensity("roomy")}>Roomy</button><button aria-pressed={density === "compact"} onClick={() => setDensity("compact")}>Compact</button></div>}
        </div>
        <div className="tw-layout-stage">
          <p className="tw-view-caption">{layout === "weave" ? "Goals in rows · dates across" : "Days in rows · sessions in time order"}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={layout} initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: still ? 1 : 0 }} transition={{ duration: still ? 0 : .12 }}>
              {layout === "weave" ? <WeaveTimeline goals={goals} study={study} selectedDate={navigation.selectedDate} onSelectDate={navigation.inspect} requestedDate={navigation.requestedDate} dayWidth={dayWidth} labelWidth={labelWidth} onVisibleDate={navigation.setVisibleDate} onFocusGoal={id => setFocusedId(current => current === id ? "all" : id)} />
                : <><WeaveWeekAgenda study={study} anchor={visibleWeek} goals={goals} selectedDate={navigation.selectedDate} onInspectDate={navigation.inspect} /><p className="tw-axis-footnote">Select a session to edit · hold its completion mark to log it</p></>}
            </motion.div>
          </AnimatePresence>
        </div>
        {navigation.visibleDate > SAMPLE_THROUGH && <p className="tw-no-plan">No saved sessions here yet. Ongoing goals continue beyond the saved plan.</p>}
        <DraftBar study={study} />
      </main>
    </div></div>
    <aside className="gv-study-notes">
      <p><strong>Week placement: balance the same dates across goals.</strong> Compare the production vertical Week agenda with the shared date axis. Select a date for an on-demand day inspector; completion is available on the sessions themselves.</p>
      <p>Try: scroll into another week, then switch layouts; move Find your pace to Saturday and switch before saving; inspect Friday; log a session directly on the board; compare both layouts on phone.</p>
      <p>The transition dissolves between orientations while keeping a stable canvas, the leading date, filters, edits and completions. It does not rotate the calendar or animate the full scroll range. Reduced motion switches immediately. Scroll smoothness remains unmeasured.</p>
    </aside>
    <WeaveDayInspector date={navigation.inspectedDate} goals={goals} study={study} onClose={() => navigation.setInspectedDate(null)} />
    <SessionEditor study={study} /><CalendarPeek study={study} />
  </StudyChrome>;
}
