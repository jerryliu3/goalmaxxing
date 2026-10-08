"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  isAppTabActive,
} from "@cadence/shared/navigation/tabs";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { isGoalSheetPath } from "@/features/goals/goal-editor-navigation";
import {
  tabChromeClasses,
  tabGridClass,
} from "@/components/navigation/tab-chrome";
import { buildAppTabs } from "@/components/navigation/tabs";
import { cn } from "@/lib/utils";

interface TabNavProps {
  mobile?: boolean;
  hrefPrefix?: string;
}

export function TabNav({
  mobile = false,
  hrefPrefix,
}: TabNavProps) {
  const { style } = useUiStyle();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const tabs = useMemo(
    () =>
      buildAppTabs(hrefPrefix ? { hrefPrefix } : undefined),
    [hrefPrefix]
  );
  const [optimisticNav, setOptimisticNav] = useState<{
    from: string;
    to: string;
  } | null>(null);
  if (optimisticNav && pathname !== optimisticNav.from) {
    setOptimisticNav(null);
  }
  // The goal sheet opens over the page you were on, so that page keeps its tab. A fresh
  // load straight onto a goal route has no page underneath and shows Goals.
  const [pagePath, setPagePath] = useState(pathname);
  const onGoalSheet = isGoalSheetPath(pathname);
  if (!onGoalSheet && pagePath !== pathname) {
    setPagePath(pathname);
  }
  const shownPath = onGoalSheet && !isGoalSheetPath(pagePath) ? pagePath : pathname;
  const activePath =
    optimisticNav && optimisticNav.from === pathname
      ? optimisticNav.to
      : shownPath;
  const gridClass = tabGridClass(tabs.length, { fitLabels: mobile });
  const currentIndex = tabs.findIndex((tab) =>
    isAppTabActive(activePath, tab.href)
  );
  const chrome = tabChromeClasses(style.tabChrome, mobile, gridClass);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlight, setHighlight] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const tab = list?.children[currentIndex] as HTMLElement | undefined;
    if (!list || !tab || currentIndex < 0) return;
    const measure = () => {
      if (tab.offsetWidth === 0) return;
      // Offset geometry belongs to the positioned list, independent of page scroll.
      const next = { left: tab.offsetLeft, top: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight };
      setHighlight(previous => previous && Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(tab);
    return () => observer.disconnect();
  }, [currentIndex, chrome.list, chrome.link]);

  return (
    <nav className={chrome.nav} aria-label="Main navigation">
      <ul ref={listRef} className={cn(chrome.list, "relative isolate")}>
        {tabs.map((tab, targetIndex) => {
          const active = isAppTabActive(activePath, tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="relative">
              <Link
                href={tab.href}
                prefetch={true}
                onClick={() => {
                  if (!isAppTabActive(shownPath, tab.href)) {
                    setOptimisticNav({ from: pathname, to: tab.href });
                  }
                }}
                transitionTypes={
                  active || currentIndex === -1
                    ? undefined
                    : [
                        targetIndex > currentIndex
                          ? "nav-forward"
                          : "nav-back",
                      ]
                }
                className={cn(chrome.link, active ? chrome.linkActive : chrome.linkIdle)}
                data-onboarding={`nav.${tab.key}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
        {currentIndex >= 0 ? (
          <motion.li
            aria-hidden="true"
            className="pointer-events-none absolute left-0 -z-10 isolate"
            initial={false}
            style={{ top: highlight?.top ?? 0, height: highlight?.height ?? "100%" }}
            animate={{
              x: highlight?.left ?? `${currentIndex * 100}%`,
              width: highlight?.width ?? `calc(100% / ${tabs.length})`,
            }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <span data-motion="tab-nav-highlight" className={chrome.highlight} />
          </motion.li>
        ) : null}
      </ul>
    </nav>
  );
}
