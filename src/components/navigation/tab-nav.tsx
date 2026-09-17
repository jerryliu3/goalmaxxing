"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import {
  isAppTabActive,
} from "@cadence/shared/navigation/tabs";
import { useUiStyle } from "@/components/brand/ui-style-provider";
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
  const activePath =
    optimisticNav && optimisticNav.from === pathname
      ? optimisticNav.to
      : pathname;
  const gridClass = tabGridClass(tabs.length);
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
