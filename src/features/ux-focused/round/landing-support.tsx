"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { Action } from "../common";
import { MonthCalendar } from "./month-calendar";
import { lessonSessions, type LessonState } from "./landing-model";
import { dateLabel } from "../model";
export function LandingActions() {
  return (
    <div className="rd-conversion">
      <Action asChild>
        <Link href="/signup">
          Create account <ArrowRight size={16} />
        </Link>
      </Action>
      <Action variant="outline" asChild>
        <Link href="/demo">Try the full demo</Link>
      </Action>
      <Link className="rd-app-link" href="/calendar">
        Already here? Go to app ↗
      </Link>
    </div>
  );
}
export function HorizonProof({ state }: { state: LessonState }) {
  const [day, setDay] = useState("2026-10-08");
  const sessions = lessonSessions(state);
  const work = sessions.map((s) => ({
    ...s,
    goal: state.story === "rhythm" ? "run" : "film",
    time: "",
    duration: s.minutes,
    end: "2026-10-31",
  }));
  return (
    <section className="rd-paper rd-horizon-proof">
      <div className="rd-between">
        <h4 className="type-heading">October at a glance</h4>
        <CalendarDays size={20} />
      </div>
      <p className="rd-muted mb-5">
        A sample week placed inside its month. Pick a date to see the work.
      </p>
      <MonthCalendar
        month="2026-10"
        day={day}
        sessions={work}
        onDay={(date) => setDay(date)}
      />
      <div className="rd-horizon-detail" aria-live="polite">
        <strong className="type-item">{dateLabel(day)}</strong>
        {sessions
          .filter((s) => s.date === day)
          .map((s) => (
            <p key={s.id}>
              {s.title} · {s.minutes} min ·{" "}
              {s.person === "partner" ? "Alex" : "You"}
            </p>
          ))}
        {!sessions.some((s) => s.date === day) && (
          <p className="rd-muted">No session placed here in this example.</p>
        )}
      </div>
    </section>
  );
}
export function PartnershipProof() {
  const [encouraged, setEncouraged] = useState(false);
  return (
    <section className="rd-paper rd-marketing-team">
      <div className="rd-between">
        <p className="type-eyebrow">You & a trusted partner</p>
        <HeartHandshake size={22} />
      </div>
      <h3 className="type-heading">Company for the long game.</h3>
      <p>
        See shared work in Duo. Keep encouragement and your partnership in Team.
      </p>
      <div className="rd-note">
        <span className="fc-person">AL</span>
        <div>
          <strong className="type-item">
            Alex finished the opening shots.
          </strong>
          <p className="rd-muted">Next: your rough cut, then Alex’s review.</p>
        </div>
      </div>
      <Action
        variant="outline"
        disabled={encouraged}
        onClick={() => setEncouraged(true)}
      >
        {encouraged
          ? "Encouragement sent in this example"
          : "Try sending encouragement"}
      </Action>
    </section>
  );
}
export function LandingDetails() {
  return (
    <section className="rd-landing-details">
      <p className="type-eyebrow">Room for different kinds of goals</p>
      <h3 className="type-title">More than a daily checkbox.</h3>
      {[
        [
          "Different rhythms, real deadlines",
          "Create recurring daily, weekly or monthly goals, or work toward an end date. Set counts, units and concrete sessions instead of forcing every intention into a streak.",
        ],
        [
          "A plan you can revise",
          "Browse your placed work in Month, Week or Day. Move sessions when your availability changes; review and save planner changes explicitly.",
        ],
        [
          "Progress and rewards",
          "Record what you did and inspect its history in Growth. Keep goals, milestones, personal rewards and earned achievements connected to the work.",
        ],
        [
          "Recovery starts with your review",
          "An eligible missed session can be reviewed, adjusted or let go. A warning is an invitation to review; it does not rewrite your plan by itself.",
        ],
        [
          "Your visibility, your choice",
          "Choose what stays private and what you share. Team-visible work and personal goals retain their existing ownership and visibility.",
        ],
      ].map(([title, copy]) => (
        <details key={title}>
          <summary className="type-item">{title}</summary>
          <p>{copy}</p>
        </details>
      ))}
      <p className="rd-privacy">
        <ShieldCheck size={16} /> A private intention can stay private.
      </p>
    </section>
  );
}
export function LandingFooter() {
  return (
    <>
      <section className="rd-landing-close">
        <p className="type-eyebrow">Start with one intention</p>
        <h3 className="type-title">
          Keep the goal.
          <br />
          Make the plan fit.
        </h3>
        <LandingActions />
      </section>
      <footer className="rd-marketing-footer">
        <span className="type-wordmark">Goalmaxxing</span>
        <nav aria-label="Landing footer">
          <a href="mailto:hello@goalmaxxing.xyz">Contact</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </>
  );
}
