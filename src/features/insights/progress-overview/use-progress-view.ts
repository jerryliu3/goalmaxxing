"use client";

import { useCallback, useEffect, useState } from "react";
import {
  parseProgressView,
  progressViewForSection,
  resolveProgressDeepLink,
  type ProgressSectionId,
  type ProgressView,
} from "@/features/insights/progress-overview/progress-view-model";

function writeViewParam(view: ProgressView) {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  if (view === "current") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", view);
  }
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}`
  );
}

/**
 * Owns which Progress view is showing. The view is mirrored into `?view=` so
 * the surface stays linkable, and `#progress-...` hashes select the view plus
 * the section to open.
 */
export function useProgressView() {
  const [view, setView] = useState<ProgressView>("current");
  const [pendingSectionId, setPendingSectionId] =
    useState<ProgressSectionId | null>(null);

  useEffect(() => {
    const applyLocation = () => {
      const deepLink = resolveProgressDeepLink(window.location.hash);
      if (deepLink) {
        setView(deepLink.view);
        setPendingSectionId(deepLink.sectionId);
        return;
      }
      setView(
        parseProgressView(
          new URLSearchParams(window.location.search).get("view")
        )
      );
    };
    applyLocation();
    window.addEventListener("hashchange", applyLocation);
    return () => window.removeEventListener("hashchange", applyLocation);
  }, []);

  const selectView = useCallback((next: ProgressView) => {
    setView(next);
    setPendingSectionId(null);
    writeViewParam(next);
  }, []);

  const selectSection = useCallback((id: ProgressSectionId) => {
    const nextView = progressViewForSection(id);
    setView(nextView);
    setPendingSectionId(id);
    writeViewParam(nextView);
  }, []);

  const clearPendingSection = useCallback(() => setPendingSectionId(null), []);

  return { view, pendingSectionId, selectView, selectSection, clearPendingSection };
}
