"use client";
import type { ReactNode } from "react";
import { ArrowUpRight, HeartHandshake } from "lucide-react";
import { Action, PersonMark } from "../common";
import { TEAM_GOALS, dateLabel } from "../model";
import { publishCheckIn } from "./team-model";
import { SessionReceipts, PartnerAcknowledgement } from "./team-parts";
import { TeamFocus, TeamHandoff } from "./team-coordination";
import type { TeamRoundState } from "./use-team-round";
export function TeamDirections({
  team,
  variant,
  goalRows,
}: {
  team: TeamRoundState;
  variant: number;
  goalRows: ReactNode;
}) {
  const { work, brief, openGoal, setDialog, noGoals, checkIn, setCheckIn } =
    team;
  const focus =
    TEAM_GOALS.find(
      (g) => g.id === team.focusGoal && work.some((s) => s.goal === g.id),
    ) ?? TEAM_GOALS.find((g) => work.some((s) => s.goal === g.id));
  return (
    <>
      {" "}
      {variant === 0 && (
        <>
          <section className="rd-brief rd-paper">
            <p className="type-eyebrow">Your partnership brief · Oct 5–11</p>
            <h3 className="type-title">
              A little momentum.
              <br />A clear next step.
            </h3>
            {brief.latest ? (
              <p>
                Alex and you recorded {brief.recorded.length} sessions on shared
                goals this week. Most recently:{" "}
                <strong>
                  {brief.latest.person === "you" ? "you" : "Alex"}
                </strong>{" "}
                finished {brief.latest.title.toLowerCase()} on{" "}
                {dateLabel(brief.latest.date)}.
              </p>
            ) : (
              <p>
                Your team is ready. Choose a shared goal to give this brief its
                first story.
              </p>
            )}
            <TeamFocus team={team} />
            <div className="rd-contributions">
              {brief.people.map((p) => (
                <div key={p.person}>
                  <PersonMark partner={p.person === "partner"} />
                  <span>
                    <strong className="type-stat">{p.count}</strong>
                    <small>
                      {p.person === "you" ? "Your" : "Alex’s"} recorded sessions
                    </small>
                  </span>
                </div>
              ))}
            </div>
            <Action variant="outline" onClick={() => setDialog("nudge")}>
              <HeartHandshake size={17} /> Send encouragement
            </Action>
          </section>
          <section className="rd-section">
            <p className="type-eyebrow">The next connection</p>
            <h3 className="type-heading">
              {focus?.id === "film"
                ? "From your rough cut to Alex’s review."
                : "Your next step together."}
            </h3>
            <p className="rd-muted">
              {focus?.id === "film"
                ? "See the next film sessions together. A reason to check in, without opening two plans."
                : "Keep the next contribution to your chosen focus in view together."}
            </p>
            <SessionReceipts
              sessions={brief.next
                .filter((s) => s.goal === focus?.id)
                .slice(0, 2)}
              onGoal={openGoal}
            />
            {!work.length && <p>No shared sessions yet.</p>}
          </section>
          {goalRows}
        </>
      )}
      {variant === 1 && (
        <>
          <header className="rd-section">
            <p className="type-eyebrow">Our shared work</p>
            <h3 className="type-title">
              A place for each thing
              <br />
              you’re doing together.
            </h3>
            <p className="rd-muted">
              The goal, each person’s contribution, and the next handoff. Your
              personal plans stay in Agenda.
            </p>
          </header>
          {noGoals ? (
            goalRows
          ) : (
            <div className="rd-dossiers">
              {TEAM_GOALS.filter((g) => work.some((s) => s.goal === g.id)).map(
                (g) => {
                  const contributions = work.filter(
                    (s) => s.goal === g.id && s.done,
                  );
                  const next = brief.next.find((s) => s.goal === g.id);
                  return (
                    <article className="rd-paper rd-dossier" key={g.id}>
                      <div className="rd-dossier-title">
                        <span className="type-eyebrow">
                          Team goal · October
                        </span>
                        <h3 className="type-heading">{g.title}</h3>
                        <p className="rd-muted">{g.detail}</p>
                      </div>
                      <div className="rd-receipts">
                        {(["you", "partner"] as const).map((person) => (
                          <div key={person}>
                            <PersonMark partner={person === "partner"} />
                            <span className="type-item">
                              {person === "you" ? "You" : "Alex"}
                            </span>
                            <strong className="type-figure">
                              {
                                contributions.filter((s) => s.person === person)
                                  .length
                              }{" "}
                              recorded
                            </strong>
                          </div>
                        ))}
                      </div>
                      <div className="rd-next">
                        <p className="type-eyebrow">Next contribution</p>
                        <p className="type-item">
                          {next?.title ?? "Nothing placed yet"}
                        </p>
                        {next && (
                          <p className="rd-muted">
                            {next.person === "you" ? "You" : "Alex"} ·{" "}
                            {dateLabel(next.date)} · {next.time}
                          </p>
                        )}
                      </div>
                      {g.id === "film" && (
                        <TeamHandoff
                          team={team}
                          onOpen={() => openGoal(g.id)}
                        />
                      )}
                      <Action variant="outline" onClick={() => openGoal(g.id)}>
                        Open the shared-goal dossier <ArrowUpRight size={16} />
                      </Action>
                    </article>
                  );
                },
              )}
            </div>
          )}
          <section className="rd-section">
            <p className="type-eyebrow">A keepsake, not a feed</p>
            <h3 className="type-heading">What you’ve finished together.</h3>
            <details className="rd-archive">
              <summary className="type-item">
                September · 1 finished team goal
              </summary>
              <p>Make the first film storyboard</p>
              <p className="rd-muted">
                Finished September 28 · Kept with your team’s history.
              </p>
              <p>You sketched the scenes. Alex assembled the sequence.</p>
            </details>
          </section>
          <Action variant="ghost" onClick={() => setDialog("nudge")}>
            Send Alex a nudge
          </Action>
        </>
      )}
      {variant === 2 && (
        <>
          <section className="rd-paper rd-rendezvous">
            <p className="type-eyebrow">Weekly rendezvous · Oct 5–11</p>
            <h3 className="type-title">
              One focus.
              <br />
              One way to help.
            </h3>
            <p>Leave a small check-in your partner can actually respond to.</p>
            {checkIn.published ? (
              <>
                <div className="rd-note">
                  <PersonMark />
                  <div>
                    <p className="type-item">{checkIn.focus}</p>
                    {checkIn.support && <p>{checkIn.support}</p>}
                    <small className="rd-muted">
                      {checkIn.acknowledged
                        ? "Alex has read your check-in"
                        : "Waiting for Alex to read"}
                    </small>
                  </div>
                </div>
                <Action
                  variant="outline"
                  onClick={() =>
                    setCheckIn((c) => ({
                      ...c,
                      published: false,
                      acknowledged: false,
                    }))
                  }
                >
                  Edit my check-in
                </Action>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCheckIn(publishCheckIn(checkIn));
                }}
              >
                <label className="rd-field">
                  My focus this week
                  <input
                    required
                    maxLength={120}
                    value={checkIn.focus}
                    onChange={(e) =>
                      setCheckIn((c) => ({ ...c, focus: e.target.value }))
                    }
                  />
                </label>
                <label className="rd-field">
                  A way Alex could help <small>Optional</small>
                  <textarea
                    maxLength={240}
                    value={checkIn.support}
                    onChange={(e) =>
                      setCheckIn((c) => ({ ...c, support: e.target.value }))
                    }
                  />
                </label>
                <Action type="submit">Share my check-in</Action>
              </form>
            )}
          </section>
          <section className="rd-paper rd-partner-note">
            <div className="rd-between">
              <PersonMark partner />
              <p className="type-eyebrow">Alex’s check-in</p>
            </div>
            <h3 className="type-heading">Keep the runs gentle this week.</h3>
            <p>
              I’d love company on Saturday’s long run. No need to match my pace.
            </p>
            <PartnerAcknowledgement />
          </section>
          {goalRows}
          <Action variant="ghost" onClick={() => setDialog("nudge")}>
            Just send a nudge instead
          </Action>
          {checkIn.published && (
            <div className="rd-simulation">
              <small>Prototype control · simulate the other person</small>
              <Action
                variant="outline"
                disabled={checkIn.acknowledged}
                onClick={() =>
                  setCheckIn((c) => ({ ...c, acknowledged: true }))
                }
              >
                Alex reads my check-in
              </Action>
            </div>
          )}
        </>
      )}
    </>
  );
}
