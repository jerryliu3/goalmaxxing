"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_THEME_ID, getTheme, type Theme, type ThemeId } from "@cadence/shared/brand";
import { applyDocumentUiStyle, parseUiStyleId, writeUiStyleCookie } from "@/lib/brand/ui-style";

interface UiStyleContextValue {
  styleId: ThemeId;
  style: Theme;
  setStyleId: (next: string) => void;
}

const UiStyleContext = createContext<UiStyleContextValue | null>(null);

export function UiStyleProvider({
  initialStyleId = DEFAULT_THEME_ID,
  children,
}: {
  initialStyleId?: ThemeId;
  children: ReactNode;
}) {
  const [styleId, setStyleIdState] = useState<ThemeId>(initialStyleId);

  const setStyleId = useCallback((next: string) => {
    const parsed = parseUiStyleId(next);
    setStyleIdState(parsed);
    writeUiStyleCookie(parsed);
    applyDocumentUiStyle(getTheme(parsed));
  }, []);

  const value = useMemo<UiStyleContextValue>(
    () => ({
      styleId,
      style: getTheme(styleId),
      setStyleId,
    }),
    [setStyleId, styleId]
  );

  return <UiStyleContext.Provider value={value}>{children}</UiStyleContext.Provider>;
}

export function useUiStyle(): UiStyleContextValue {
  const context = useContext(UiStyleContext);
  if (context) {
    return context;
  }
  return {
    styleId: DEFAULT_THEME_ID,
    style: getTheme(DEFAULT_THEME_ID),
    setStyleId: (next) => {
      const parsed = parseUiStyleId(next);
      writeUiStyleCookie(parsed);
      applyDocumentUiStyle(getTheme(parsed));
    },
  };
}
