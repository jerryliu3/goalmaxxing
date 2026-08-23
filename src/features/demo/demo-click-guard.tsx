"use client";

import { useEffect } from "react";
import { prefixAppHref } from "@/lib/navigation/demo-path";
import { useAppRouter } from "@/lib/navigation/use-app-router";

export function DemoClickGuard() {
  const router = useAppRouter();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a");
      if (!anchor || (anchor.target && anchor.target !== "_self")) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("http://") ||
        href.startsWith("https://")
      ) {
        return;
      }
      const prefixed = prefixAppHref(href);
      if (prefixed === href) {
        return;
      }
      event.preventDefault();
      router.push(prefixed);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
