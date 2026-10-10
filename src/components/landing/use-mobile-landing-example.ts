"use client";
import { useMemo, useState } from "react";
import {
  canRecordLandingSession,
  LANDING_EXAMPLE_TODAY,
  landingExampleGoalFields,
  landingExampleSessions,
  type LandingExampleMove,
  type LandingExampleTarget,
} from "./mobile-landing-model";

export function useMobileLandingExample() {
  const [target, setTarget] = useState<LandingExampleTarget>(8);
  const [move, setMove] = useState<LandingExampleMove>("original");
  const [selectedDay, setSelectedDay] = useState(LANDING_EXAMPLE_TODAY);
  const [completed, setCompleted] = useState(() => new Set(["run-1", "run-5"]));
  const sessions = useMemo(
    () => landingExampleSessions(target, move),
    [target, move],
  );
  const fields = useMemo(() => landingExampleGoalFields(target), [target]);
  const recordedCount = completed.size;
  const recordSessions = landingExampleSessions(12, move).filter(
    (session) =>
      sessions.some((placed) => placed.id === session.id) ||
      completed.has(session.id),
  );
  const changeSession = sessions.find((session) => session.id === "run-8")!;
  const canMove = !completed.has(changeSession.id);
  const toggleCompletion = (id: string) => {
    const session = recordSessions.find((candidate) => candidate.id === id);
    if (
      !session ||
      !canRecordLandingSession(
        session.date,
        session.changed && move === "draft",
      )
    )
      return;
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const proposeMove = () => {
    if (!canMove || move !== "original") return;
    setMove("draft");
    setSelectedDay("2026-10-09");
  };
  const reset = () => {
    setTarget(8);
    setMove("original");
    setSelectedDay(LANDING_EXAMPLE_TODAY);
    setCompleted(new Set(["run-1", "run-5"]));
  };
  const undoMove = () => {
    setMove("original");
    setSelectedDay(LANDING_EXAMPLE_TODAY);
  };
  return {
    target,
    setTarget,
    move,
    setMove,
    selectedDay,
    setSelectedDay,
    completed,
    sessions,
    fields,
    recordedCount,
    recordSessions,
    changeSession,
    canMove,
    toggleCompletion,
    proposeMove,
    undoMove,
    reset,
  };
}
