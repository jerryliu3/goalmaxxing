import type { TabChromeKind } from "@/lib/brand/ui-style";
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

export function tabGridClass(count: number): string {
  return GRID_BY_COUNT[count] ?? "grid-cols-4";
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
        mobile ? "min-h-12 flex-col gap-1 py-1.5 text-[10px]" : "min-h-11 flex-col gap-1 py-2 text-[11px]"
      ),
      linkActive: mobile ? "text-selection-foreground" : "text-foreground",
      linkIdle: "text-muted-foreground hover:text-foreground",
      highlight: cn(
        "absolute -z-10 shadow-none",
        mobile
          ? "inset-x-0.5 top-1 bottom-1 rounded-md bg-selection"
          : "inset-x-2 bottom-0 h-0.5 rounded-none bg-selection"
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
    linkActive: "text-selection-foreground",
    linkIdle: "text-muted-foreground hover:bg-muted hover:text-foreground",
    highlight: "absolute inset-0 -z-10 rounded-xl bg-selection shadow-sm",
  };
}
