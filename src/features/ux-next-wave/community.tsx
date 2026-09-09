import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Flag,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Concept } from "./model";
import type { Study } from "./use-study";
const PEOPLE = [
  {
    name: "Maya",
    initials: "MY",
    goal: "Endurance",
    count: 4,
    total: 5,
    color: "endurance",
  },
  {
    name: "Theo",
    initials: "TH",
    goal: "Product",
    count: 3,
    total: 4,
    color: "product",
  },
  {
    name: "Jules",
    initials: "JL",
    goal: "Strength",
    count: 2,
    total: 3,
    color: "strength",
  },
];
export function Community({ concept, s }: { concept: Concept; s: Study }) {
  const [view, setView] = useState("team"),
    [detail, setDetail] = useState<string | null>(null);
  const { joined, setJoined } = s;
  const title = {
    prism: ["Good company.", "Shared momentum."],
    tempo: ["Your people.", "Your pace."],
    weave: ["Different goals.", "A common thread."],
    mosaic: ["Better,", "piece by piece."],
    script: ["Keep good", "company."],
  }[concept];
  return (
    <div className={`community-layout community-${concept}`}>
      <div className="community-heading">
        <div>
          <span className="eyebrow">COMMUNITY · YOUR SMALL CORNER</span>
          <h1>
            {title[0]}
            <br />
            <em>{title[1]}</em>
          </h1>
        </div>
        <div className="community-avatars">
          {PEOPLE.map((p) => (
            <span className={p.color} key={p.name}>
              {p.initials}
            </span>
          ))}
          <span>YOU</span>
        </div>
      </div>
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="community-tabs" aria-label="Community view">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
      </Tabs>
      {view === "team" && (
        <div className="community-team">
          <div className="people-grid">
            {PEOPLE.map((p, i) => (
              <button
                className={`person-card ${p.color}`}
                key={p.name}
                onClick={() => setDetail(p.name)}
              >
                <div className="person-top">
                  <span className="person-avatar">{p.initials}</span>
                  <ArrowUpRight size={21} />
                </div>
                <span className="person-numeral">0{i + 1}</span>
                <h2>{p.name}</h2>
                <p>{p.goal}</p>
                {concept === "script" ? (
                  <div className="person-sentence">
                    Made time for <b>{p.count}</b> of {p.total} sessions.
                  </div>
                ) : (
                  <>
                    <div className="person-count">
                      <strong>
                        {p.count}
                        <small>/{p.total}</small>
                      </strong>
                      <span>
                        sessions
                        <br />
                        this week
                      </span>
                    </div>
                    <div className="person-marks">
                      {Array.from({ length: p.total }, (_, j) => (
                        <span className={j < p.count ? "filled" : ""} key={j}>
                          {j < p.count ? <Check size={13} /> : null}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {concept === "weave" && (
                  <div className="person-week">
                    {Array.from({ length: p.total }, (_, j) => (
                      <span
                        key={j}
                        className={j < p.count ? "active" : ""}
                        aria-label={`Session ${j + 1}: ${j < p.count ? "complete" : "planned"}`}
                      >
                        {j < p.count ? <Check size={14} /> : j + 1}
                      </span>
                    ))}
                  </div>
                )}
                <span className="person-bottom">
                  Shared weekly summary
                  <ChevronRight size={15} />
                </span>
              </button>
            ))}
          </div>
          <aside className="team-note">
            <Users size={22} />
            <div>
              <h3>A little accountability. Plenty of space.</h3>
              <p>
                Weekly summaries from your team. Your full plan stays personal.
              </p>
              <span>Sample profiles · No messages are sent in this study.</span>
            </div>
          </aside>
        </div>
      )}
      {view === "challenges" && (
        <div className="challenge-grid">
          <section className="challenge-poster">
            <div className="section-label">
              <span>SEPTEMBER CHALLENGE</span>
              <Flag size={24} />
            </div>
            <h2>
              Show up.
              <br />
              Ten times.
            </h2>
            <p>
              Ten sessions toward any of your goals.
              <br />
              Your pace. Your definition of effort.
            </p>
            <div className="challenge-punches">
              {Array.from({ length: 10 }, (_, i) => (
                <span className={joined && i < s.done ? "filled" : ""} key={i}>
                  {joined && i < s.done ? (
                    <Check size={24} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
              ))}
            </div>
            <button className="primary" onClick={() => setJoined(!joined)}>
              {joined ? "Leave demo challenge" : "Join demo challenge"}
              {joined ? <Check size={18} /> : <ArrowRight size={18} />}
            </button>
            <span>
              {joined
                ? `${s.done} of 10 sessions · Updated from your demo plan`
                : "A private simulation. No real membership changes."}
            </span>
          </section>
          <aside className="challenge-side">
            <span className="eyebrow">HOW IT WORKS</span>
            <h3>Effort is the entry.</h3>
            <p>
              Complete sessions in Planner. Each completion adds one mark here.
              Reopening a session removes its mark.
            </p>
            <div>
              <strong>10</strong>
              <span>sessions</span>
            </div>
            <div>
              <strong>30</strong>
              <span>days in September</span>
            </div>
            <p>There’s no missed-day penalty. Participation is optional.</p>
          </aside>
        </div>
      )}
      {view === "leaderboard" && (
        <section className="leaderboard">
          <div className="section-label">
            <span>YOUR TEAM · WEEKLY SESSIONS</span>
            <span>DEMO STANDINGS</span>
          </div>
          <h2>A friendly nudge.</h2>
          <p className="muted">
            A count of completed sessions, not a measure of anyone’s ambition.
          </p>
          {[
            ...PEOPLE.map((p) => ({
              name: p.name,
              count: p.count,
              initials: p.initials,
            })),
            { name: "You", count: s.done, initials: "JL" },
          ]
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
            .map((p, i) => (
              <div
                className={`leader-row ${p.name === "You" ? "you" : ""}`}
                key={p.name}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span className="leader-avatar">{p.initials}</span>
                <strong>{p.name}</strong>
                <div className="leader-track">
                  <i style={{ width: `${(p.count / 10) * 100}%` }} />
                </div>
                <b>{p.count}</b>
                <span>sessions</span>
              </div>
            ))}
        </section>
      )}
      <Dialog
        open={!!detail}
        onOpenChange={(v) => {
          if (!v) setDetail(null);
        }}
      >
        <DialogContent
          className={`nw-modal nw-${concept}`}
          overlayClassName="nw-overlay"
          showCloseButton={false}
        >
          <button
            className="modal-close"
            aria-label="Close profile"
            onClick={() => setDetail(null)}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">SHARED WEEKLY SUMMARY</span>
          <DialogTitle className="modal-title">{detail}’s week</DialogTitle>
          <DialogDescription className="modal-description">
            {PEOPLE.find((p) => p.name === detail)?.goal} · Sample teammate
          </DialogDescription>
          <div className="profile-summary">
            <strong>
              {PEOPLE.find((p) => p.name === detail)?.count}
              <small> / {PEOPLE.find((p) => p.name === detail)?.total}</small>
            </strong>
            <span>sessions completed</span>
          </div>
          <p className="modal-description">
            This teammate shares a weekly total. Detailed schedules and
            individual sessions remain private.
          </p>
          <button className="primary" onClick={() => setDetail(null)}>
            Back to your team
            <ArrowRight size={18} />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
