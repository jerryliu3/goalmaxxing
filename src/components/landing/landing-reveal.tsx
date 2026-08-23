"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export function useInViewOnce(threshold = 0.3) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    const rect = node.getBoundingClientRect();
    const hasLayout = rect.width > 0 || rect.height > 0;
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (hasLayout && !inViewport) {
      setInView(false);
    }

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function LandingReveal({ children }: { children: ReactNode }) {
  const reducedMotion = Boolean(useReducedMotion());
  const { ref, inView } = useInViewOnce(0.28);

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={
        reducedMotion || inView
          ? { opacity: 1, y: 0 }
          : { opacity: 1, y: 28 }
      }
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
