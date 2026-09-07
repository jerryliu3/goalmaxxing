"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyDocumentUiStyle,
  DEFAULT_UI_STYLE_ID,
  getUiStyle,
  parseUiStyleId,
  writeUiStyleCookie,
  type UiStyle,
  type UiStyleId,
} from "@/lib/brand/ui-style";

interface UiStyleContextValue {
  styleId: UiStyleId;
  style: UiStyle;
  setStyleId: (next: string) => void;
}

const UiStyleContext = createContext<UiStyleContextValue | null>(null);

export function UiStyleProvider({
  initialStyleId = DEFAULT_UI_STYLE_ID,
  children,
}: {
  initialStyleId?: UiStyleId;
  children: ReactNode;
}) {
  const [styleId, setStyleIdState] = useState<UiStyleId>(initialStyleId);

  const setStyleId = useCallback((next: string) => {
    const parsed = parseUiStyleId(next);
    setStyleIdState(parsed);
    writeUiStyleCookie(parsed);
    applyDocumentUiStyle(getUiStyle(parsed));
  }, []);

  const value = useMemo<UiStyleContextValue>(
    () => ({
      styleId,
      style: getUiStyle(styleId),
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
    styleId: DEFAULT_UI_STYLE_ID,
    style: getUiStyle(DEFAULT_UI_STYLE_ID),
    setStyleId: (next) => {
      const parsed = parseUiStyleId(next);
      writeUiStyleCookie(parsed);
      applyDocumentUiStyle(getUiStyle(parsed));
    },
  };
}
