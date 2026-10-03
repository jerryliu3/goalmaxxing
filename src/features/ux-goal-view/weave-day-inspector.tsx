"use client";

import type { Goal } from "@/lib/goals/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dateLabel } from "./model";
import { SessionCompletion } from "./session-completion";
import { studyTheme } from "./theme";
import type { GoalViewStudySession } from "./use-study";
import { sessionsOnDate } from "./weave-model";

export function WeaveDayInspector({ date, goals, study, onClose }: { date: string | null; goals: Goal[]; study: GoalViewStudySession; onClose: () => void }) {
  const sessions = date ? sessionsOnDate(study.state.sessions, date, goals.map(g => g.id)) : [];
  return <Dialog open={date !== null} onOpenChange={open => { if (!open) onClose(); }}>
    {date && <DialogContent className="gv-editor tw-day-inspector sm:max-w-lg" style={studyTheme}>
      <p className="gv-overline">Day in context</p>
      <DialogTitle className="gv-display">{dateLabel(date, "EEEE, MMMM d")}</DialogTitle>
      <DialogDescription>{sessions.length} scheduled {sessions.length === 1 ? "session" : "sessions"}, ordered by time{goals.length === 1 ? " for this goal" : " across the visible goals"}. Select a session to edit it.</DialogDescription>
      <div className="tw-inspector-list">{sessions.map(session => <div key={session.id} className="tw-inspector-row">
        <SessionCompletion session={session} study={study} />
        <button className="tw-inspector-open" onClick={() => { onClose(); study.setEditingId(session.id); }}>
          <strong>{goals.find(g => g.id === session.goalId)?.title}</strong>
          <span>{session.time || "Any time"} · {session.name}</span>
        </button>
      </div>)}</div>
      {!sessions.length && <p className="gv-empty">No saved sessions for this date.</p>}
    </DialogContent>}
  </Dialog>;
}
