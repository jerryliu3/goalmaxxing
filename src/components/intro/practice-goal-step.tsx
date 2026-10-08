"use client";

import { useRef, useState } from "react";
import { addDays } from "date-fns";
import { useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { EarnedCeremony, type FlightOrigin } from "@/features/ux-brand/plaque-motion/earned-ceremony";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { toLocalDateString } from "@/lib/dates/day";
import { PracticeSessionStep } from "./practice-session-step";

const TARGET = 7;

export function PracticeGoalStep({ onComplete }: { onComplete: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [fields] = useState(() => ({
    ...createDefaultGoalCreationFields(),
    title: "Make time to move",
    recurrence_interval: "weekly" as const,
    target_count: String(TARGET),
    end_date: toLocalDateString(addDays(new Date(), 27)),
  }));
  const [filled, setFilled] = useState(false);
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);
  const still = Boolean(useReducedMotion());

  return (
    <div className="space-y-4">
      <div ref={cardRef} className="mx-auto max-w-72">
        <TempoGoalCard
          fields={fields}
          rotatable={false}
          assembly={{ completed: filled ? TARGET : TARGET - 1, target: TARGET }}
        />
      </div>
      <PracticeSessionStep
        completed={filled}
        label="Complete the last session"
        title="Last session"
        onComplete={() => {
          setFilled(true);
          window.setTimeout(() => {
            const rect = cardRef.current?.getBoundingClientRect();
            setOrigin(rect
              ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
              : { left: 0, top: 0, width: 32, height: 32 });
          }, 900);
        }}
      />
      <DialogPrimitive.Root open={Boolean(origin)} onOpenChange={(open) => { if (!open) { setOrigin(null); onComplete(); } }}>
        {origin && (
          <EarnedCeremony
            fields={fields}
            target={TARGET}
            reward=""
            still={still}
            grand
            origin={origin}
            preview
            onClose={() => { setOrigin(null); onComplete(); }}
          />
        )}
      </DialogPrimitive.Root>
    </div>
  );
}
