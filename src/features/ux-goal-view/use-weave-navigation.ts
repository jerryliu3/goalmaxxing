"use client";

import { useState } from "react";
import { weekOf } from "./model";
import { SAMPLE_TODAY } from "./sample";
import { AXIS_END, AXIS_START } from "./weave-axis";

export function useWeaveNavigation() {
  const [selectedDate, setSelectedDate] = useState(SAMPLE_TODAY);
  const [visibleDate, setVisibleDate] = useState(weekOf(SAMPLE_TODAY));
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);
  const [requestedDate, setRequestedDate] = useState({ date: weekOf(SAMPLE_TODAY), revision: 0 });
  const navigate = (date: string) => {
    const bounded = date < AXIS_START ? AXIS_START : date > AXIS_END ? AXIS_END : date;
    setVisibleDate(bounded);
    setSelectedDate(bounded);
    setInspectedDate(null);
    setRequestedDate(current => ({ date: bounded, revision: current.revision + 1 }));
  };
  const inspect = (date: string) => { setSelectedDate(date); setInspectedDate(date); };
  return { selectedDate, setSelectedDate, visibleDate, setVisibleDate, inspectedDate, setInspectedDate, requestedDate, navigate, inspect };
}
