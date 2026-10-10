"use client";
import { TEAM_NUDGE_USER_TEXT_MAX_LENGTH } from "@cadence/shared/social/team";
import { GoalArtifact, StudyDialog } from "@/features/ux-refresh/primitives";
import { Action, HoldCompletion, PersonMark } from "../common";
import { TEAM_GOALS, TODAY, dateLabel } from "../model";
import {
  INITIAL_CHECK_IN,
  INITIAL_TEAM_SESSIONS,
  recordOwnSession,
} from "./team-model";
import { SessionReceipts } from "./team-parts";
import type { TeamRoundState } from "./use-team-round";
export function TeamDialogs({ team }: { team: TeamRoundState }) {
  const {
    dialog,
    setDialog,
    nudge,
    setNudge,
    setMessage,
    setRelationship,
    setCheckIn,
    setSessions,
    goal,
    setGoalId,
    work,
    sessions,
  } = team;
  return (
    <>
      {" "}
      <StudyDialog
        open={dialog === "nudge"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Send Alex a little encouragement"
        description="A short nudge, without starting a chat."
        footer={
          <Action
            onClick={() => {
              setDialog(null);
              setMessage(
                `Nudge sent in this sample${nudge.trim() ? `: ${nudge.trim()}` : "."}`,
              );
            }}
          >
            Send nudge
          </Action>
        }
      >
        <label className="rd-field">
          Your note{" "}
          <small>Optional · {TEAM_NUDGE_USER_TEXT_MAX_LENGTH} characters</small>
          <textarea
            maxLength={TEAM_NUDGE_USER_TEXT_MAX_LENGTH}
            value={nudge}
            onChange={(e) => setNudge(e.target.value)}
            placeholder="Looking forward to your rough-cut review."
          />
        </label>
      </StudyDialog>
      <StudyDialog
        open={dialog === "partner"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Alex Lee"
        description="@alexlee · Your teammate"
      >
        <div className="rd-partner-profile">
          <PersonMark partner />
          <p className="type-heading">
            Making films. Taking the long way home.
          </p>
          <p>Team member since September 12, 2026.</p>
          <p className="rd-muted">
            Only team-visible work appears here. Personal and private goals stay
            outside the team.
          </p>
        </div>
      </StudyDialog>
      <StudyDialog
        open={dialog === "settings" || dialog === "leave"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog === "leave" ? "Leave this team?" : "Your partnership"}
        description={
          dialog === "leave"
            ? "You and Alex will no longer share Duo progress until a new team is active."
            : "Team details and membership."
        }
        footer={
          dialog === "leave" ? (
            <div className="rf-actions">
              <Action variant="outline" onClick={() => setDialog("settings")}>
                Keep team
              </Action>
              <Action
                variant="destructive"
                onClick={() => {
                  setRelationship("No partner");
                  setDialog(null);
                  setCheckIn(INITIAL_CHECK_IN);
                  setMessage("You left the sample team.");
                }}
              >
                Leave team
              </Action>
            </div>
          ) : (
            <Action onClick={() => setDialog(null)}>Done</Action>
          )
        }
      >
        {dialog === "leave" ? (
          <p>
            This affects membership, not the completion history of your personal
            goals.
          </p>
        ) : (
          <>
            <p className="type-heading">You & Alex · 2,400 Team XP</p>
            <Action variant="outline" onClick={() => setDialog("partner")}>
              View Alex’s profile
            </Action>
            <Action variant="ghost" onClick={() => setDialog("leave")}>
              Leave team…
            </Action>
          </>
        )}
      </StudyDialog>
      <StudyDialog
        open={dialog === "goals"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Choose your first team goal"
        description="Start the sample team with one shared intention."
      >
        <p className="rd-muted">
          These fixtures stand in for the existing team-goal creation flow;
          choosing one adds its sample work here.
        </p>
        {TEAM_GOALS.map((g) => (
          <Action
            className="my-2 w-full"
            variant="outline"
            key={g.id}
            onClick={() => {
              setRelationship("Paired");
              setSessions(INITIAL_TEAM_SESSIONS.filter((s) => s.goal === g.id));
              setDialog(null);
              setMessage(`${g.title} added to this sample team.`);
            }}
          >
            {g.title}
          </Action>
        ))}
      </StudyDialog>
      <StudyDialog
        open={Boolean(goal)}
        onOpenChange={(open) => !open && setGoalId(null)}
        title={goal?.title ?? "Shared goal"}
        description="Team-visible contributions and the next placed work. Recording your session uses the same hold gesture as Agenda."
      >
        {goal && (
          <>
            <div className="rd-small-art">
              <GoalArtifact
                id={goal.id}
                completed={
                  work.filter((s) => s.goal === goal.id && s.done).length
                }
              />
            </div>
            <h4 className="type-heading">Contribution record</h4>
            <SessionReceipts
              sessions={work.filter((s) => s.goal === goal.id && s.done)}
            />
            <h4 className="type-heading mt-6">Next placed work</h4>
            {work
              .filter((s) => s.goal === goal.id && !s.done)
              .map((s) => (
                <div className="fc-line" key={s.id}>
                  <HoldCompletion
                    done={s.done}
                    title={s.title}
                    disabled={s.person !== "you" || s.date > TODAY}
                    onCommit={() =>
                      setSessions(recordOwnSession(sessions, s.id))
                    }
                  />
                  <div className="fc-grow">
                    <p className="type-item">{s.title}</p>
                    <p className="rd-muted">
                      {s.person === "you" ? "You" : "Alex"} ·{" "}
                      {dateLabel(s.date)} · {s.time}
                    </p>
                  </div>
                </div>
              ))}
            <p className="rd-muted mt-4">
              Future sessions and Alex’s sessions are read only. Team is not a
              second planner.
            </p>
          </>
        )}
      </StudyDialog>
    </>
  );
}
