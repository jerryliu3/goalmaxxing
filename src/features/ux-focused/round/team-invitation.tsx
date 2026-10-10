"use client";
import { Users } from "lucide-react";
import { Action } from "../common";
import type { TeamRoundState } from "./use-team-round";
export function TeamInvitation({ team }: { team: TeamRoundState }) {
  const {
    relationship,
    setRelationship,
    recipient,
    setRecipient,
    inviteMessage,
    setInviteMessage,
    setMessage,
  } = team;
  return (
    <section className="rd-paper rd-invite">
      <Users size={28} />
      <h3 className="type-title">A partner, not an audience.</h3>
      <p>
        Share goals, encourage each other, and keep a little history of what you
        do together.
      </p>
      {relationship === "No partner" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (recipient.trim()) {
              setRelationship("Outgoing invitation");
              setMessage("Invitation sent in this sample.");
            }
          }}
        >
          <label className="rd-field">
            Partner’s username
            <input
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </label>
          <label className="rd-field">
            A personal note
            <textarea
              maxLength={240}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />
          </label>
          <Action type="submit">Invite partner</Action>
        </form>
      ) : relationship === "Incoming invitation" ? (
        <>
          <p>
            <strong>Alex Lee</strong> invited you to a team.
          </p>
          <blockquote>“Want to keep each other going this month?”</blockquote>
          <div className="rf-actions">
            <Action onClick={() => setRelationship("Paired")}>
              Accept invitation
            </Action>
            <Action
              variant="outline"
              onClick={() => setRelationship("No partner")}
            >
              Decline
            </Action>
          </div>
        </>
      ) : (
        <>
          <p>Invitation pending · @{recipient}</p>
          <blockquote>{inviteMessage}</blockquote>
          <Action
            variant="outline"
            onClick={() => setRelationship("No partner")}
          >
            Cancel invitation
          </Action>
          <div className="rd-simulation">
            <small>Prototype control · simulate the other person</small>
            <Action variant="outline" onClick={() => setRelationship("Paired")}>
              Alex accepts
            </Action>
          </div>
        </>
      )}
    </section>
  );
}
