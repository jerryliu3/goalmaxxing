"use client";
import { useReducer, useState } from "react";
import { TODAY } from "../model";
import {
  INITIAL_MONTH_STATE,
  monthReducer,
  monthSessions,
  visibleMonthWork,
} from "./month-model";
export function useMonthRound() {
  const [state, dispatch] = useReducer(monthReducer, INITIAL_MONTH_STATE);
  const [month, setMonth] = useState("2026-10");
  const [day, setDay] = useState(TODAY);
  const [scope, setScope] = useState<"Solo" | "Partner" | "Duo">("Solo");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState(TODAY);
  const [review, setReview] = useState(false);
  const [notice, setNotice] = useState("");
  const sessions = monthSessions(state);
  const visible = visibleMonthWork(sessions, scope, filter).filter(
    (s) =>
      !query.trim() ||
      s.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const selected = sessions.find((s) => s.id === selectedId);
  const missed = sessions.filter(
    (s) => s.recoverable && s.date < TODAY && !s.done && s.person === "you",
  );
  function selectDay(date: string) {
    setDay(date);
    setMonth(date.slice(0, 7));
  }
  function openSession(id: string) {
    const s = sessions.find((s) => s.id === id);
    if (s) {
      setSelectedId(id);
      setProposedDate(s.date);
    }
  }
  return {
    state,
    dispatch,
    month,
    setMonth,
    day,
    selectDay,
    scope,
    setScope,
    filter,
    setFilter,
    query,
    setQuery,
    filters,
    setFilters,
    selectedId,
    setSelectedId,
    proposedDate,
    setProposedDate,
    review,
    setReview,
    notice,
    setNotice,
    sessions,
    visible,
    selected,
    missed,
    openSession,
  };
}
export type MonthRoundState = ReturnType<typeof useMonthRound>;
