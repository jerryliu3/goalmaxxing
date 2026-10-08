"use client";

import { useState } from "react";
import { addDays } from "date-fns";
import { useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { EarnedCeremony, type FlightOrigin } from "@/features/ux-brand/plaque-motion/earned-ceremony";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { toLocalDateString } from "@/lib/dates/day";

export function PracticeGoalStep({ onComplete }: { onComplete: () => void }) {
  const [fields] = useState(() => ({
    ...createDefaultGoalCreationFields(),
    title: "Make time to move",
    recurrence_interval: "weekly" as const,
    target_count: "3",
    end_date: toLocalDateString(addDays(new Date(), 27)),
  }));
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);
  const still = Boolean(useReducedMotion());
  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-72">
        <TempoGoalCard fields={fields} rotatable={false} />
      </div>
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
          }}
        >
          Preview ceremony
        </Button>
      </div>
      <DialogPrimitive.Root open={Boolean(origin)} onOpenChange={(open) => { if (!open) { setOrigin(null); onComplete(); } }}>
        {origin && (
          <EarnedCeremony
            fields={fields}
            target={Number(fields.target_count)}
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
