"use client";
import { Settings, ChevronRight } from "lucide-react";
import { Notice } from "@/features/ux-refresh/primitives";
import { Action, PersonMark, ProductHeader, StudyState } from "../common";
import { INITIAL_CHECK_IN, type Relationship } from "./team-model";
import { useTeamRound } from "./use-team-round";
import { SharedGoals } from "./team-parts";
import { TeamDirections } from "./team-directions";
import { TeamInvitation } from "./team-invitation";
import { TeamDialogs } from "./team-dialogs";
export function TeamRound({ variant }: { variant: number }) {
  const team = useTeamRound();
  const {
    relationship,
    setRelationship,
    setMessage,
    setDialog,
    setGoalId,
    setCheckIn,
    paired,
    noGoals,
    work,
    openGoal,
    message,
  } = team;
  const goalRows = (
    <SharedGoals
      sessions={work}
      noGoals={noGoals}
      onGoal={openGoal}
      onChoose={() => setDialog("goals")}
    />
  );
  return (
    <div className="fc-product rd-team" data-direction={variant}>
      <StudyState
        value={relationship}
        options={[
          "Paired",
          "No partner",
          "Outgoing invitation",
          "Incoming invitation",
          "No shared goals",
        ]}
        onChange={(v) => {
          setRelationship(v as Relationship);
          setMessage("");
          setDialog(null);
          setGoalId(null);
          setCheckIn(INITIAL_CHECK_IN);
          team.setFocusGoal("film");
          team.setHandoff("editing");
        }}
      />
      <ProductHeader
        title={paired ? "You & Alex" : "Better, together"}
        detail="Community / Team"
      >
        {paired && (
          <Action
            variant="outline"
            onClick={() => setDialog("settings")}
            aria-label="Team settings"
          >
            <Settings size={18} />
          </Action>
        )}
      </ProductHeader>
      {paired ? (
        <>
          <div className="rd-partnership">
            <button
              className="rd-person-link"
              onClick={() => setDialog("partner")}
            >
              <PersonMark partner />
              <span className="type-item">
                Alex Lee<small>@alexlee · Together since September</small>
              </span>
              <ChevronRight size={16} />
            </button>
            <div className="rd-xp">
              <span className="type-stat">2,400</span>
              <small>Team XP</small>
            </div>
          </div>
          <TeamDirections team={team} variant={variant} goalRows={goalRows} />
        </>
      ) : (
        <TeamInvitation team={team} />
      )}
      {message && <Notice>{message}</Notice>}
      <TeamDialogs team={team} />
    </div>
  );
}
