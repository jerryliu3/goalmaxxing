"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import {
  isAppTabActive,
} from "@cadence/shared/navigation/tabs";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { buildAppTabs } from "@/components/navigation/tabs";
import type { TabChromeKind } from "@/lib/brand/ui-style";
import { cn } from "@/lib/utils";

const GRID_BY_COUNT: Record<number, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

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
  const activePath =
    optimisticNav && optimisticNav.from === pathname
      ? optimisticNav.to
      : pathname;
  const gridClass = GRID_BY_COUNT[tabs.length] ?? "grid-cols-4";
  const currentIndex = tabs.findIndex((tab) =>
    isAppTabActive(activePath, tab.href)
  );
  const highlightLayoutId = mobile ? "mobile-tab-highlight" : "desktop-tab-highlight";
  const chrome = tabChromeClasses(style.tabChrome, mobile, gridClass);

  return (
    <nav className={chrome.nav} aria-label="Main navigation">
      <ul className={chrome.list}>
        {tabs.map((tab, targetIndex) => {
          const active = isAppTabActive(activePath, tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="relative">
              <Link
                href={tab.href}
                prefetch={true}
                onClick={() => {
                  if (!isAppTabActive(pathname, tab.href)) {
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
                {active ? (
                  <motion.span
                    layoutId={highlightLayoutId}
                    aria-hidden="true"
                    data-motion="tab-nav-highlight"
                    className={chrome.highlight}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.24,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                  />
                ) : null}
                <Icon className="size-5" />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function tabChromeClasses(tabChrome: TabChromeKind, mobile: boolean, gridClass: string) {
  if (tabChrome === "underline") {
    return {
      nav: cn(
        "w-full",
        mobile
          ? "fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)]"
          : "border-b border-border"
      ),
      list: cn(
        "grid w-full gap-1",
        mobile
          ? `${gridClass} max-w-[27rem] border-t border-border bg-background/90 px-1.5 pt-1.5 shadow-[0_-8px_24px_-18px_rgba(36,28,20,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-background/80`
          : gridClass
      ),
      link: cn(
        "relative isolate flex w-full touch-manipulation items-center justify-center px-2 font-medium uppercase tracking-[0.12em] transition-[color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none",
        mobile ? "min-h-12 flex-col gap-1 py-1.5 text-[10px]" : "min-h-11 flex-col gap-1 py-2 text-[11px]"
      ),
      linkActive: "text-primary",
      linkIdle: "text-muted-foreground hover:text-foreground",
      highlight: cn(
        "absolute -z-10 bg-transparent shadow-none",
        mobile
          ? "inset-x-3 top-1 bottom-1 rounded-md border border-primary/40"
          : "inset-x-2 bottom-0 h-0.5 rounded-none bg-primary"
      ),
    };
  }

  return {
    nav: cn(
      "w-full",
      mobile
        ? "fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)]"
        : "mx-auto rounded-2xl border bg-card/90 p-1"
    ),
    list: cn(
      "grid w-full gap-1",
      mobile
        ? `${gridClass} max-w-[27rem] rounded-[1.35rem] border border-border/20 bg-background/50 p-1.5 shadow-sm shadow-black/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/50`
        : gridClass
    ),
    link: cn(
      "relative isolate flex w-full touch-manipulation items-center justify-center rounded-xl px-2 font-medium transition-[color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none",
      mobile ? "min-h-12 flex-col gap-1 py-1.5 text-[10px]" : "min-h-14 flex-col gap-1 py-2 text-[11px]"
    ),
    linkActive: "text-white",
    linkIdle: "text-muted-foreground hover:bg-muted hover:text-foreground",
    highlight: "absolute inset-0 -z-10 rounded-xl bg-primary shadow-sm",
  };
}
