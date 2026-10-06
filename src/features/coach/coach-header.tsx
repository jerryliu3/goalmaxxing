"use client";
import { useEffect } from "react";
import { checkInHeading } from "@/features/digest/check-in-actions";
import { DIGEST_OPEN_EVENT } from "@/features/digest/digest-api";
import { CoachMark } from "./coach-mark";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachHeader() {
  const coach = useCoach();
  const openCheckIn = coach?.openCheckIn;
  useEffect(() => {
    if (!openCheckIn) return;
    const replay = () => void openCheckIn();
    window.addEventListener(DIGEST_OPEN_EVENT, replay);
    return () => window.removeEventListener(DIGEST_OPEN_EVENT, replay);
  }, [openCheckIn]);
  if (!coach) return null;
  const busy = Object.values(coach.conversations).some(conversation => conversation.runs.some(run => run.status === "running"));
  return <div className={s.headerEntry}>
    <button ref={coach.launcher} className={s.headerButton} aria-label="Open your coach" aria-expanded={coach.mode !== "closed"} aria-controls="coach-surface" onClick={() => coach.mode === "closed" ? coach.open() : coach.close()}>
      <CoachMark small /><span className={s.headerLabel}>Coach</span>{(busy || coach.offer.payload) && <i className={s.statusDot} aria-label={busy ? "Response in progress" : "Check-in ready"} />}
    </button>
    {coach.offer.payload && <aside className={s.invitation} aria-label="Check-in invitation">
      <p>Your {checkInHeading(coach.offer.payload.kind).toLowerCase()} is ready.</p>
      <div><button onClick={() => void coach.openCheckIn()}>Open</button><button onClick={coach.offer.dismiss}>Skip</button></div>
    </aside>}
  </div>;
}
