import type { TabChromeKind } from "@cadence/shared/brand";
import { cn } from "@/lib/utils";

const GRID_BY_COUNT: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

export interface TabChromeClasses {
  nav: string;
  list: string;
  link: string;
  linkActive: string;
  linkIdle: string;
  highlight: string;
}

/**
 * The phone bar's tabs share its width equally while there is room, but a
 * tab is never narrower than its icon and label, so its selected frame (the
 * whole tab) always contains them at any screen width.
 */
const FITTED_GRID_BY_COUNT: Record<number, string> = {
  2: "grid-cols-[repeat(2,minmax(min-content,1fr))]",
  3: "grid-cols-[repeat(3,minmax(min-content,1fr))]",
  4: "grid-cols-[repeat(4,minmax(min-content,1fr))]",
  5: "grid-cols-[repeat(5,minmax(min-content,1fr))]",
  6: "grid-cols-[repeat(6,minmax(min-content,1fr))]",
};

export function tabGridClass(count: number, { fitLabels = false } = {}): string {
  return (fitLabels ? FITTED_GRID_BY_COUNT : GRID_BY_COUNT)[count] ?? "grid-cols-4";
}

/**
 * Class recipe shared by the app tab bar and in-page segmented tabs so both
 * follow the active UI style chrome.
 */
export function tabChromeClasses(
  tabChrome: TabChromeKind,
  mobile: boolean,
  gridClass: string
): TabChromeClasses {
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
        // Narrow phone tabs keep their width for the label, with tighter
        // tracking so four equal tabs fit "Achievements" on a 375px phone.
        mobile
          ? "min-h-12 flex-col gap-1 px-1 py-1.5 text-[10px] tracking-[0.06em]"
          : "min-h-11 flex-col gap-1 py-2 text-[11px]"
      ),
      linkActive: mobile ? "text-selection-foreground" : "text-foreground",
      linkIdle: "text-muted-foreground hover:text-foreground",
      highlight: cn(
        "absolute -z-10 bg-selection shadow-none",
        mobile
          ? // The whole tab, so every tab's frame is the same size and
            // always wider than its label.
            "inset-0 rounded-md border border-selection"
          : "inset-x-2 bottom-0 h-0.5 rounded-none"
      ),
    };
  }

  return {
    // Desktop tabs size to their labels so the header can center them between
    // status and account controls; the header's own border is their baseline.
    nav: mobile
      ? "fixed inset-x-0 bottom-0 z-50 flex w-full justify-center px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)]"
      : "",
    list: mobile
      ? `grid w-full gap-1 ${gridClass} max-w-[27rem] rounded-[1.35rem] border border-border/20 bg-background/50 p-1.5 shadow-sm shadow-black/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/50`
      : `grid w-max gap-1 ${gridClass}`,
    link: cn(
      "relative isolate flex w-full touch-manipulation items-center justify-center rounded-xl px-2 font-medium transition-[color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none",
      mobile ? "min-h-12 flex-col gap-1 py-1.5 text-[10px]" : "min-h-16 min-w-[6.5rem] flex-col gap-1 px-3 py-2 text-xs"
    ),
    linkActive: mobile ? "text-selection-foreground" : "text-foreground",
    linkIdle: mobile
      ? "text-muted-foreground hover:bg-muted hover:text-foreground"
      : "text-muted-foreground hover:text-foreground",
    // Destination selection uses the second hue; actions retain primary.
    highlight: mobile
      ? "absolute inset-0 -z-10 rounded-xl bg-selection shadow-sm"
      : "absolute inset-x-4 bottom-0 -z-10 h-0.5 rounded-full bg-selection",
  };
}
