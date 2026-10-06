"use client";

import { createContext, useContext, useEffect } from "react";

/** Lets a goal sheet know whether the form inside it holds changes that closing would lose. */
export const UnsavedChangesContext = createContext<((dirty: boolean) => void) | null>(null);

/** Report this form's unsaved changes to the surrounding goal sheet, if there is one. */
export function useReportUnsavedChanges(dirty: boolean) {
  const report = useContext(UnsavedChangesContext);
  useEffect(() => {
    report?.(dirty);
    return () => report?.(false);
  }, [report, dirty]);
}
