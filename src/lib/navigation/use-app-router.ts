"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { isBrowserDemoPath, prefixAppHref } from "@/lib/navigation/demo-path";

export function useAppRouter() {
  const router = useRouter();
  return useMemo(() => {
    const resolveHref = (href: string) =>
      isBrowserDemoPath() ? prefixAppHref(href) : href;
    return {
      back: () => router.back(),
      forward: () => router.forward(),
      refresh: () => router.refresh(),
      prefetch: (href: string) => router.prefetch(resolveHref(href)),
      push: (href: string) => router.push(resolveHref(href)),
      replace: (href: string) => router.replace(resolveHref(href)),
    };
  }, [router]);
}
