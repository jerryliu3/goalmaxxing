"use client";

import { motion, useReducedMotion } from "motion/react";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import {
  tabChromeClasses,
  tabGridClass,
} from "@/components/navigation/tab-chrome";
import { cn } from "@/lib/utils";

export interface SegmentedTabItem<Value extends string> {
  value: Value;
  label: string;
  /** Id of the panel this tab controls, when one exists. */
  controlsId?: string;
}

/**
 * In-page tab switcher that borrows the app tab bar chrome, so a section
 * toggle inside a page reads the same as the top-level navigation.
 */
export function SegmentedTabs<Value extends string>({
  items,
  value,
  onChange,
  label,
  highlightLayoutId,
  className,
}: {
  items: ReadonlyArray<SegmentedTabItem<Value>>;
  value: Value;
  onChange: (next: Value) => void;
  label: string;
  highlightLayoutId: string;
  className?: string;
}) {
  const { style } = useUiStyle();
  const reduceMotion = useReducedMotion();
  const chrome = tabChromeClasses(style.tabChrome, false, tabGridClass(items.length));

  return (
    <div className={cn(chrome.nav, className)}>
      <div className={chrome.list} role="tablist" aria-label={label}>
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`${highlightLayoutId}-${item.value}`}
              aria-selected={active}
              aria-controls={item.controlsId}
              className={cn(
                chrome.link,
                "min-h-11 flex-row gap-0 py-2 text-[11px] uppercase tracking-[0.12em]",
                active ? chrome.linkActive : chrome.linkIdle
              )}
              onClick={() => onChange(item.value)}
            >
              {active ? (
                <motion.span
                  layoutId={highlightLayoutId}
                  aria-hidden="true"
                  data-motion="segmented-tab-highlight"
                  className={chrome.highlight}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                  }
                />
              ) : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
