"use client";
import { useState } from "react";
import { TEAM_GOALS } from "../model";
import {
  INITIAL_CHECK_IN,
  INITIAL_TEAM_SESSIONS,
  teamBrief,
  type Relationship,
} from "./team-model";
export function useTeamRound() {
  const [relationship, setRelationship] = useState<Relationship>("Paired");
  const [sessions, setSessions] = useState(INITIAL_TEAM_SESSIONS);
  const [dialog, setDialog] = useState<
    "partner" | "settings" | "leave" | "nudge" | "goals" | null
  >(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("alexlee");
  const [inviteMessage, setInviteMessage] = useState(
    "Want to keep each other going this month?",
  );
  const [nudge, setNudge] = useState("");
  const [message, setMessage] = useState("");
  const [checkIn, setCheckIn] = useState(INITIAL_CHECK_IN);
  const paired =
    relationship === "Paired" || relationship === "No shared goals";
  const noGoals = relationship === "No shared goals";
  const work = noGoals ? [] : sessions;
  const brief = teamBrief(work);
  const goal = TEAM_GOALS.find((g) => g.id === goalId);
  const openGoal = (id: string) => setGoalId(id);
  return {
    relationship,
    setRelationship,
    sessions,
    setSessions,
    dialog,
    setDialog,
    goalId,
    setGoalId,
    recipient,
    setRecipient,
    inviteMessage,
    setInviteMessage,
    nudge,
    setNudge,
    message,
    setMessage,
    checkIn,
    setCheckIn,
    paired,
    noGoals,
    work,
    brief,
    goal,
    openGoal,
  };
}
export type TeamRoundState = ReturnType<typeof useTeamRound>;
