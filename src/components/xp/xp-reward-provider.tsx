"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import type { ViewportRectSnapshot } from "@/lib/xp/events";

interface XpRewardFlight {
  sourceRect: ViewportRectSnapshot;
  targetRect: ViewportRectSnapshot;
  amount?: number;
}

interface XpRewardContextValue {
  celebrate: (flight: XpRewardFlight) => void;
}

const XpRewardContext = createContext<XpRewardContextValue>({
  celebrate: () => undefined,
});

function XpRewardLayer({ children }: { children: ReactNode }) {
  const still = useReducedMotion();
  const [flights, setFlights] = useState<Array<XpRewardFlight & { id: number }>>([]);
  const sequence = useRef(0);
  const celebrate = useCallback((flight: XpRewardFlight) => {
    if (still) return;
    const id = ++sequence.current;
    setFlights(current => [...current.slice(-3), { ...flight, id }]);
  }, [still]);
  useEffect(() => {
    if (!flights.length) return;
    const timeout = window.setTimeout(() => setFlights([]), 1800);
    return () => window.clearTimeout(timeout);
  }, [flights]);

  return (
    <XpRewardContext.Provider value={{ celebrate }}>
      {children}
      {flights.length > 0 && !still && createPortal(<div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
        data-motion="xp-reward-overlay"
      >
        {flights.map(flight => {
          const x = flight.sourceRect.left + flight.sourceRect.width / 2;
          const y = flight.sourceRect.top + flight.sourceRect.height / 2;
          const tx = flight.targetRect.left + flight.targetRect.width / 2 - x;
          const ty = flight.targetRect.top + flight.targetRect.height / 2 - y;
          return <div key={flight.id} data-reward-burst className="absolute" style={{ left: x, top: y }}>
            {[0, 1, 2, 3, 4].map(index => <motion.span key={index} className="absolute text-primary" style={{ fontSize: 19 + index % 2 * 5 }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x: [0, (index - 2) * 24, tx], y: [0, -35 - index * 8, ty], scale: [0.4, 1.15, 0.2], opacity: [0, 1, 0] }}
              transition={{ delay: 0.32 + index * 0.055, duration: 0.85, times: [0, 0.3, 1], ease: "easeInOut" }}>✦</motion.span>)}
            {flight.amount !== undefined && <motion.span className="absolute whitespace-nowrap font-mono text-sm font-semibold text-primary" initial={{ y: 0, opacity: 0 }} animate={{ y: -36, opacity: [0, 1, 0] }} transition={{ duration: 1.2 }}>+{flight.amount} XP</motion.span>}
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
