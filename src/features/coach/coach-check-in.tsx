"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckInBody } from "@/features/digest/check-in-body";
import { buildCheckInCoachQuestion, checkInHeading } from "@/features/digest/check-in-actions";
import { subscribePlannerTabCacheInvalidation } from "@/lib/cache/planner-tab-cache";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachCheckInContent() {
  const coach = useCoach()!;
  const router = useRouter();
  const { refreshCheckIn } = coach;
  const payload = coach.checkIn;
  useEffect(() => subscribePlannerTabCacheInvalidation(() => { void refreshCheckIn().catch(() => undefined); }), [refreshCheckIn]);
  if (!payload) return <div className={s.contentView}><p className={s.intro}>{coach.checkInError ?? "Reading your current check-in…"}</p><Button variant="outline" size="sm" onClick={() => void coach.openCheckIn()}>Open current check-in</Button></div>;
  return <div className={s.contentView}><p className={s.eyebrow}>{checkInHeading(payload.kind)} · {payload.localDate}</p><p className={s.intro}>Recap {payload.facts.recap.start} — {payload.facts.recap.end}. Next {payload.facts.ahead.start} — {payload.facts.ahead.end}.</p>
    <CheckInBody payload={payload} briefingSettled={!coach.checkInGenerating} onNavigate={href => { if (href) { coach.returnToApp(); router.push(href); } }} onCompleted={() => void coach.refreshCheckIn().catch(error => coach.setError(error.message))} />
    {coach.checkInError && <p role="alert" className={s.help}>{coach.checkInError} Your computed recap is still available.</p>}
    <div className={s.checkInButtons}><Button variant="outline" size="sm" disabled={!coach.conversation} onClick={() => {
      if (coach.draft.trim()) { coach.setError("Your conversation has an unfinished draft. Send or clear it before adding this check-in question."); return; }
      coach.setDraft(buildCheckInCoachQuestion({ kind: payload.kind, facts: payload.facts }), { kind: payload.kind, periodKey: payload.periodKey });
      coach.showView("conversation");
    }}>Talk this through</Button><Button variant="ghost" size="sm" disabled={coach.checkInGenerating} onClick={() => void coach.refreshCheckIn(true).catch(error => coach.setError(error.message))}>Refresh briefing</Button></div>
  </div>;
}
