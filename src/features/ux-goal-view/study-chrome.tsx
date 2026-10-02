"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, RotateCcw, Smartphone, Monitor } from "lucide-react";
import type { GoalViewStudySession } from "./use-study";
import { studyTheme } from "./theme";

export function StudyChrome({ children, controls, phone, onPhoneChange, onReset, week = false }: { children: ReactNode; controls?: ReactNode; phone: boolean; onPhoneChange: (phone: boolean) => void; onReset: () => void; week?: boolean }) {
  return <div className="gv-study" style={studyTheme}>
    <header className="gv-lab-header">
      <Link href="/ux" className="gv-lab-back"><ArrowLeft size={15} />UX labs</Link>
      <span className="gv-lab-title">Goal view & calendar studies</span>
      <nav aria-label="Prototype surfaces"><Link href="/ux/goal-view" aria-current={week ? undefined : "page"}>Goal view</Link>{week && <span aria-current="page">Time Weave</span>}</nav>
      <div className="gv-lab-device" role="group" aria-label="Preview size"><button className="gv-icon-button" aria-label="Desktop preview" aria-pressed={!phone} onClick={() => onPhoneChange(false)}><Monitor size={17} /></button><button className="gv-icon-button" aria-label="Phone preview" aria-pressed={phone} onClick={() => onPhoneChange(true)}><Smartphone size={17} /></button></div>
      <button className="gv-icon-button" aria-label="Reset sample" title="Reset sample" onClick={onReset}><RotateCcw size={16} /></button>
    </header>
    <div className="gv-lab-controls">{controls}<span>Interactive sample · Friday, Oct 2, 2026 · changes reset on reload</span></div>
    {children}
  </div>;
}

export function DraftBar({ study }: { study: GoalViewStudySession }) {
  return <div className="gv-status-area">
    <div className="gv-announcement" role="status" aria-live="polite">{study.state.notice || "Tap a date to edit. Use the arrows to move one day. Complete today or a past date."}</div>
    {study.edits > 0 && <div className="gv-draft-bar"><div><strong>{study.edits} {study.edits === 1 ? "session changed" : "sessions changed"}</strong><span>Review your dates, then save the plan.</span></div><button className="gv-button" onClick={() => study.dispatch({ type: "discard" })}>Undo changes</button><button className="gv-button gv-primary" onClick={() => study.dispatch({ type: "save" })}>Save plan</button></div>}
  </div>;
}
