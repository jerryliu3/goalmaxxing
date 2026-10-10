"use client";
import { Check, Handshake } from "lucide-react";
import { Action } from "../common";
import { TEAM_GOALS } from "../model";
import type { TeamRoundState } from "./use-team-round";
export function TeamFocus({ team }: { team: TeamRoundState }) {
  const available = TEAM_GOALS.filter((g) =>
    team.work.some((s) => s.goal === g.id),
  );
  const chosen = available.find((g) => g.id === team.focusGoal) ?? available[0];
  if (!chosen) return null;
  return (
    <div className="rd-team-focus">
      <label className="rd-field">
        <span className="type-eyebrow">Our focus this week</span>
        <select
          value={chosen.id}
          onChange={(e) => team.setFocusGoal(e.target.value)}
        >
          {available.map((g) => (
            <option value={g.id} key={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>
      <p className="rd-muted">
        Pick the one shared goal to keep in view together. Your placed sessions
        stay where they are.
      </p>
    </div>
  );
}
export function TeamHandoff({
  team,
  onOpen,
}: {
  team: TeamRoundState;
  onOpen: () => void;
}) {
  const ready = team.work.some(
    (s) => s.id === "f2" && s.done && s.person === "you",
  );
  return (
    <div className="rd-goal-handoff">
      <p className="type-eyebrow">
        <Handshake size={15} /> Partner review
      </p>
      {team.handoff === "editing" ? (
        <>
          <p className="type-item">Your rough cut → Alex’s review</p>
          <p className="rd-muted">
            When the rough cut is recorded, let Alex know it is ready for the
            next pass.
          </p>
          {ready ? (
            <Action variant="outline" onClick={() => team.setHandoff("ready")}>
              Mark ready for Alex’s review
            </Action>
          ) : (
            <Action variant="outline" onClick={onOpen}>
              Record the rough-cut session first
            </Action>
          )}
        </>
      ) : team.handoff === "ready" ? (
        <>
          <p className="type-item">Ready for Alex</p>
          <p className="rd-muted">
            Alex can now see that the rough cut is ready. The scheduled review
            stays on Friday.
          </p>
          <Action variant="ghost" onClick={() => team.setHandoff("editing")}>
            Return to editing
          </Action>
          <div className="rd-simulation">
            <small>Prototype control · simulate the other person</small>
            <Action
              variant="outline"
              onClick={() => team.setHandoff("reviewed")}
            >
              Alex leaves a review
            </Action>
          </div>
        </>
      ) : (
        <>
          <p className="type-item">
            <Check size={15} /> Alex reviewed the rough cut
          </p>
          <blockquote>
            “The opening reads clearly. Could we tighten the final ten seconds?”
          </blockquote>
          <Action variant="outline" onClick={() => team.setHandoff("editing")}>
            Back to editing
          </Action>
        </>
      )}
      <p className="rd-muted mt-3">
        A handoff status never completes a session or changes its date.
      </p>
    </div>
  );
}
