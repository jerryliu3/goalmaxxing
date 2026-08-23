"use client";

import { useEffect, useRef, useState } from "react";
import { getPinnedChapterProgress } from "@/components/landing/landing-wow-progress";

export function LandingWowPinnedChapter({
  testId,
  heightVh,
  progress: progressOverride,
  reducedMotion,
  children,
}: {
  testId: string;
  heightVh: number;
  progress?: number;
  reducedMotion: boolean;
  children: (progress: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const update = () => {
      setScrollProgress(
        getPinnedChapterProgress(
          node.getBoundingClientRect().top,
          node.offsetHeight,
          window.innerHeight
        )
      );
    };

    update();

    const scrollTargets = new Set<EventTarget>([window, document]);
    if (document.scrollingElement) {
      scrollTargets.add(document.scrollingElement);
    }

    for (const target of scrollTargets) {
      target.addEventListener("scroll", update, { passive: true, capture: true });
    }
    window.addEventListener("resize", update);
    return () => {
      for (const target of scrollTargets) {
        target.removeEventListener("scroll", update, { capture: true });
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  const progress = progressOverride ?? (reducedMotion ? 1 : scrollProgress);

  return (
    <section
      ref={ref}
      data-testid={testId}
      data-wow-progress={progress.toFixed(3)}
      className="relative"
      style={{ height: `${heightVh}vh` }}
    >
      <div
        data-testid="wow-climb-stage"
        className="sticky top-14 h-[calc(100svh-3.5rem)] overflow-hidden"
      >
        {children(progress)}
      </div>
    </section>
  );
}
