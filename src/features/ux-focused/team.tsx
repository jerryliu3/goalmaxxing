"use client";
import { useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Settings,
  ArrowUpRight,
} from "lucide-react";
import { StudyDialog, Notice } from "@/features/ux-refresh/primitives";
import { Action, Empty, PersonMark, ProductHeader, StudyState } from "./common";
import {
  TEAM_GOALS,
  TEAM_SESSIONS,
  TODAY,
  dateLabel,
  weekActivity,
  type TeamSession,
} from "./model";

export function TeamBaseline() {
  return (
    <div className="fc-product">
      <ProductHeader title="Alex Lee" detail="Team" />
      <p className="type-figure">Team XP · 2,400</p>
      <section className="fc-section">
        <h3 className="type-heading">Shared week</h3>
        <div className="fc-week fc-baseline-week">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} data-elapsed={i < 3} data-today={i === 3}>
              {day}
            </div>
          ))}
        </div>
        <p className="fc-muted">
          Colored by weekday, without completion counts.
        </p>
      </section>
      <section className="fc-section">
        <h3 className="type-heading">Shared goals</h3>
        {TEAM_GOALS.map((goal) => (
          <div className="fc-line" key={goal.id}>
            <span>{goal.title}</span>
            <span className="fc-muted">Open on Plan ↗</span>
          </div>
        ))}
        <p className="fc-muted">Both links lead to the same week calendar.</p>
      </section>
    </div>
  );
}

function SessionList({
  sessions,
  onGoal,
}: {
  sessions: readonly TeamSession[];
  onGoal: (goal: string) => void;
}) {
  return (
    <ul className="fc-list">
      {sessions.map((session) => (
        <li className="fc-line" key={session.id}>
          <PersonMark partner={session.person === "partner"} />
          <div className="fc-grow">
            <button
              className="fc-text-button type-item"
              onClick={() => onGoal(session.goal)}
            >
              {session.title}
              <ArrowUpRight size={14} aria-hidden />
            </button>
            <p className="fc-muted">
              {session.person === "you" ? "You" : "Alex"} · {session.time}
            </p>
          </div>
          <span className="fc-status" data-done={session.done}>
            {session.done ? "Done" : "Planned"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TeamStudy({ variant }: { variant: number }) {
  const [scenario, setScenario] = useState("Paired");
  const [day, setDay] = useState(TODAY);
  const [focusedGoal, setFocusedGoal] = useState("run");
  const [goalId, setGoalId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [leave, setLeave] = useState(false);
  const [invite, setInvite] = useState("");
  const [recipient, setRecipient] = useState("alexlee");
  const [nudged, setNudged] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const goal = TEAM_GOALS.find((item) => item.id === goalId);
  const isPaired = scenario === "Paired" || scenario === "No shared goals";
  const noGoals = scenario === "No shared goals";
  const sessions = noGoals ? [] : TEAM_SESSIONS;
  const visibleSessions =
    variant === 1
      ? sessions.filter((session) => session.goal === focusedGoal)
      : sessions;
  const activity = weekActivity(visibleSessions);
  const shown = visibleSessions.filter((session) => session.date === day);
  const goals = (
    <section className="fc-section">
      <div className="fc-between">
        <h3 className="type-heading">Shared goals</h3>
        <span className="fc-muted">
          {noGoals ? 0 : TEAM_GOALS.length} together
        </span>
      </div>
      {noGoals ? (
        <Empty title="Your first shared goal">
          <p>
            Start with something you both want to work on. Goals keep their
            existing ownership and visibility.
          </p>
          <Action onClick={() => setGoalId("create")}>
            Choose a shared goal
          </Action>
        </Empty>
      ) : (
        TEAM_GOALS.map((item) => {
          const relevant = sessions.filter((s) => s.goal === item.id);
          const done = relevant.filter((s) => s.done).length;
          const next = relevant.find((s) => !s.done && s.date >= TODAY);
          return (
            <button
              className="fc-goal-row"
              key={item.id}
              aria-pressed={variant === 1 ? focusedGoal === item.id : undefined}
              onClick={() =>
                variant === 1 ? setFocusedGoal(item.id) : setGoalId(item.id)
              }
            >
              <div className="fc-grow">
                <h4 className="type-item">{item.title}</h4>
                <p className="fc-muted">{item.detail}</p>
                <p className="fc-next">
                  {next
                    ? `Next: ${next.person === "you" ? "you" : "Alex"} · ${dateLabel(next.date)}`
                    : "No upcoming session"}
                </p>
                <progress
                  aria-label={`${item.title} weekly completions`}
                  value={done}
                  max={relevant.length}
                />
              </div>
              <span className="type-figure">
                {done}/{relevant.length}
                <small className="fc-muted block">this week</small>
              </span>
              <ChevronRight size={18} aria-hidden />
            </button>
          );
        })
      )}
    </section>
  );
  const week = (
    <section className="fc-section">
      <div className="fc-between">
        <div>
          <h3 className="type-heading">
            {variant === 1
              ? TEAM_GOALS.find((item) => item.id === focusedGoal)?.title
              : "Your week together"}
          </h3>
          <p className="fc-muted">October 5–11 · shared-goal completions</p>
        </div>
        <CalendarDays size={20} aria-hidden />
      </div>
      <div className="fc-week">
        {activity.map((item) => (
          <button
            key={item.date}
            aria-label={`${dateLabel(item.date)}, you ${item.you}, Alex ${item.partner}, ${item.planned} planned`}
            aria-pressed={day === item.date}
            aria-current={item.date === TODAY ? "date" : undefined}
            onClick={() => setDay(item.date)}
          >
            <small>{dateLabel(item.date).slice(0, 3)}</small>
            <strong className="type-figure">
              {Number(item.date.slice(-2))}
            </strong>
            <span className="fc-pair-count">
              <span>{item.future ? "–" : item.you}</span>
              <span>{item.future ? "–" : item.partner}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="fc-muted fc-legend">
        <span>● You</span>
        <span>○ Alex</span>
        <span>– upcoming</span>
      </p>
      <div className="fc-between mt-5">
        <h4 className="type-heading">
          {dateLabel(day)}
          {day === TODAY ? " · Today" : ""}
        </h4>
        <span className="fc-muted">
          {shown.filter((s) => s.done).length} done
        </span>
      </div>
      {shown.length ? (
        <SessionList sessions={shown} onGoal={setGoalId} />
      ) : (
        <p className="fc-muted py-5">
          {noGoals
            ? "Your shared sessions will appear here."
            : "Nothing scheduled together on this day."}
        </p>
      )}
    </section>
  );
  return (
    <>
      <StudyState
        value={scenario}
        options={[
          "Paired",
          "No partner",
          "Invitation pending",
          "No shared goals",
        ]}
        onChange={(value) => {
          setScenario(value);
          setNudged(false);
        }}
      />
      <div className="fc-product">
        <ProductHeader
          title={isPaired ? "Maya & Alex" : "Better with a little company"}
          detail="Community / Team"
        >
          {isPaired && (
            <Action
              variant="outline"
              aria-label="Team settings"
              onClick={() => setSettings(true)}
            >
              <Settings size={18} />
            </Action>
          )}
        </ProductHeader>
        {isPaired ? (
          <>
            <div className="fc-partner">
              <PersonMark partner />
              <div className="fc-grow">
                <button
                  className="fc-text-button type-item"
                  onClick={() => setPartnerOpen(true)}
                >
                  Alex Lee <ArrowUpRight size={14} />
                </button>
                <p className="fc-muted">Your partner · @alexlee</p>
              </div>
              <Action
                variant="outline"
                disabled={nudged}
                onClick={() => setNudged(true)}
              >
                {nudged ? "Encouragement sent" : "Send encouragement"}
              </Action>
            </div>
            {nudged && <Notice>Sample encouragement sent to Alex.</Notice>}
            <div className="fc-team-layout">
              {variant === 0 ? (
                <>
                  {week}
                  {goals}
                </>
              ) : (
                <>
                  {goals}
                  {week}
                </>
              )}
            </div>
          </>
        ) : scenario === "Invitation pending" ? (
          <Empty title={`Waiting for @${recipient}`}>
            <p>
              Your invitation is pending. You can continue using Goalmaxxing
              while you wait.
            </p>
            <Action variant="outline" onClick={() => setScenario("No partner")}>
              Cancel invitation
            </Action>
            <Action variant="ghost" onClick={() => setScenario("Paired")}>
              Sample: accept invitation
            </Action>
          </Empty>
        ) : (
          <div className="fc-invite">
            <div>
              <h3 className="type-title">Keep showing up, together.</h3>
              <p>
                Follow shared goals, see each other&apos;s progress, and send a
                little encouragement. Your private goals stay private.
              </p>
              <ul>
                <li>A week you can check together</li>
                <li>Shared goals with clear next steps</li>
                <li>A partner, without a public performance</li>
              </ul>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (invite.trim()) {
                  setRecipient(invite.trim().replace(/^@/, ""));
                  setScenario("Invitation pending");
                }
              }}
            >
              <label className="rf-field">
                Partner&apos;s username
                <input
                  required
                  value={invite}
                  onChange={(event) => setInvite(event.target.value)}
                  placeholder="alexlee"
                />
              </label>
              <Action type="submit" disabled={!invite.trim()}>
                Invite partner
              </Action>
            </form>
          </div>
        )}
      </div>
      <StudyDialog
        open={settings}
        onOpenChange={(open) => {
          setSettings(open);
          if (!open) setLeave(false);
        }}
        title="Team settings"
        description="Your partnership, separate from your personal preferences."
      >
        {leave ? (
          <Empty title="Leave this team?">
            <p>You will no longer see a shared week with Alex.</p>
            <Action variant="outline" onClick={() => setLeave(false)}>
              Keep team
            </Action>
            <Action
              variant="destructive"
              onClick={() => {
                setScenario("No partner");
                setSettings(false);
                setLeave(false);
              }}
            >
              Leave sample team
            </Action>
          </Empty>
        ) : (
          <>
            <div className="fc-line">
              <PersonMark partner />
              <span>Alex Lee · @alexlee</span>
            </div>
            <Action
              variant="outline"
              onClick={() => {
                setSettings(false);
                setPartnerOpen(true);
              }}
            >
              View partner
            </Action>
            <Action variant="ghost" onClick={() => setLeave(true)}>
              Leave team
            </Action>
          </>
        )}
      </StudyDialog>
      <StudyDialog
        open={partnerOpen}
        onOpenChange={setPartnerOpen}
        title="Alex Lee"
        description="Partner profile preview"
      >
        <PersonMark partner />
        <p className="my-5">
          Training for a fall 10K. Making a short film with Maya.
        </p>
        <p className="fc-muted">Only shared sample activity is shown here.</p>
      </StudyDialog>
      <StudyDialog
        open={goalId !== null}
        onOpenChange={(open) => {
          if (!open) setGoalId(null);
        }}
        title={goal?.title ?? "Choose a shared goal"}
        description={
          goal
            ? "The selected goal's sessions, with ownership and dates."
            : "Shared-goal setup is a separate production decision."
        }
      >
        {goal ? (
          <>
            <p className="my-4">{goal.detail}</p>
            <SessionList
              sessions={TEAM_SESSIONS.filter((s) => s.goal === goal.id)}
              onGoal={setGoalId}
            />
            <p className="fc-muted mt-5">
              Open Agenda in Duo to plan your next session together.
            </p>
          </>
        ) : (
          <p className="my-5">
            This exploration proposes a direct entrance to shared-goal setup. It
            does not assume an existing goal can be converted or create new
            sharing permissions.
          </p>
        )}
      </StudyDialog>
    </>
  );
}
