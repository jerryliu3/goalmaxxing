"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import type { ViewportRectSnapshot } from "@/lib/xp/events";
import { COMPLETION_STAMP_IMPACT_MS, subscribeCompletionMotion } from "@/lib/feedback/completion-motion";
import { captureViewportRect } from "@/lib/xp/events";

interface XpRewardFlight {
  sourceRect: ViewportRectSnapshot;
  targetRect: ViewportRectSnapshot;
  amount?: number;
  motionStartedAt?: number;
}

interface XpRewardContextValue {
  /** Milliseconds until the last star reaches the bar; zero without motion. */
  celebrate: (flight: XpRewardFlight) => number;
}

const XpRewardContext = createContext<XpRewardContextValue>({
  celebrate: () => 0,
});

const STAR_COUNT = 5;
const STAR_START_SECONDS = COMPLETION_STAMP_IMPACT_MS / 1000;
const STAR_STAGGER_SECONDS = 0.055;
const STAR_FLIGHT_SECONDS = 0.85;
const STAR_ABSORB_SECONDS = 0.12;
export const XP_REWARD_ARRIVAL_MS = Math.round(
  (STAR_START_SECONDS + (STAR_COUNT - 1) * STAR_STAGGER_SECONDS + STAR_FLIGHT_SECONDS) * 1000
);

function XpRewardLayer({ children }: { children: ReactNode }) {
  const still = useReducedMotion();
  const [flights, setFlights] = useState<Array<XpRewardFlight & { id: number }>>([]);
  const sequence = useRef(0);
  const celebrate = useCallback((flight: XpRewardFlight) => {
    if (still) return 0;
    if (flight.motionStartedAt !== undefined) {
      return Math.max(0, XP_REWARD_ARRIVAL_MS - (performance.now() - flight.motionStartedAt));
    }
    const id = ++sequence.current;
    setFlights(current => [...current.slice(-3), { ...flight, id }]);
    return XP_REWARD_ARRIVAL_MS;
  }, [still]);
  useEffect(() => subscribeCompletionMotion(detail => {
    const target = document.querySelector("[data-xp-reward-target='true']");
    if (target) celebrate({ sourceRect: detail.sourceRect, targetRect: captureViewportRect(target) });
  }), [celebrate]);
  useEffect(() => {
    if (!flights.length) return;
    const timeout = window.setTimeout(() => setFlights([]), XP_REWARD_ARRIVAL_MS + 200);
    return () => window.clearTimeout(timeout);
  }, [flights]);

  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);

  return (
    <XpRewardContext.Provider value={{ celebrate }}>
      {children}
      {mounted && createPortal(<div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
        data-motion="xp-reward-overlay"
      >
        {!still && flights.map(flight => {
          const x = flight.sourceRect.left + flight.sourceRect.width / 2;
          const y = flight.sourceRect.top + flight.sourceRect.height / 2;
          const tx = flight.targetRect.left + flight.targetRect.width / 2 - x;
          const ty = flight.targetRect.top + flight.targetRect.height / 2 - y;
          return <div key={flight.id} data-reward-burst className="absolute" style={{ left: x, top: y }}>
            {Array.from({ length: STAR_COUNT }, (_, index) => <motion.span key={index} className="absolute text-primary" style={{ fontSize: 19 + index % 2 * 5 }}
              initial={{ x: (index - 2) * 22, y: -22 - (2 - Math.abs(index - 2)) * 12, scale: 0, opacity: 0 }}
              animate={{ x: [(index - 2) * 22, (index - 2) * 22, tx, tx], y: [-22 - (2 - Math.abs(index - 2)) * 12, -22 - (2 - Math.abs(index - 2)) * 12, ty, ty], scale: [0, 1, 1, 0.2], opacity: [0, 1, 1, 0] }}
              transition={{ delay: STAR_START_SECONDS + index * STAR_STAGGER_SECONDS, duration: STAR_FLIGHT_SECONDS + STAR_ABSORB_SECONDS, times: [0, 0.12, STAR_FLIGHT_SECONDS / (STAR_FLIGHT_SECONDS + STAR_ABSORB_SECONDS), 1], ease: "easeInOut" }}><span className="block -translate-x-1/2 -translate-y-1/2">✦</span></motion.span>)}
          </div>;
        })}
      </div>, document.body)}
    </XpRewardContext.Provider>
  );
}

export function XpRewardProvider({ children }: { children: ReactNode }) {
  return <XpRewardLayer>{children}</XpRewardLayer>;
}

export function useXpReward() {
  return useContext(XpRewardContext);
}

const subscribeNothing = () => () => {};
