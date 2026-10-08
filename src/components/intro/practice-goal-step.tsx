"use client";

import { useState } from "react";
import { addDays } from "date-fns";
import { useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { EarnedCeremony, type FlightOrigin } from "@/features/ux-brand/plaque-motion/earned-ceremony";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { toLocalDateString } from "@/lib/dates/day";

export function PracticeGoalStep({ onComplete, onReset }: { onComplete: () => void; onReset: () => void }) {
  const [fields, setFields] = useState(() => ({ ...createDefaultGoalCreationFields(), title: "Make time to move", recurrence_interval: "weekly" as const, target_count: "3", end_date: toLocalDateString(addDays(new Date(), 27)) }));
  const [built, setBuilt] = useState(false);
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);
  const still = Boolean(useReducedMotion());
  const closePreview = () => { setOrigin(null); onComplete(); };
  return <div className="space-y-4">
    <p className="text-muted-foreground">Give a practice goal a name and a weekly rhythm. Then preview the achievement ceremony you’ll earn when a real goal is finished.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="practice-goal-name">Goal name</Label><Input id="practice-goal-name" value={fields.title} maxLength={80}
        onChange={event => { setFields(value => ({ ...value, title: event.target.value })); setBuilt(false); onReset(); }} /></div>
      <div className="space-y-2"><Label htmlFor="practice-goal-rhythm">Days per week</Label><select id="practice-goal-rhythm" value={fields.target_count}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" onChange={event => { setFields(value => ({ ...value, target_count: event.target.value })); setBuilt(false); onReset(); }}>
        {[1,2,3,4,5,6].map(count => <option key={count} value={count}>{count} {count===1?'day':'days'}</option>)}
      </select></div>
    </div>
    {built && <div className="mx-auto max-w-72"><TempoGoalCard fields={fields} rotatable={false} /></div>}
    <Button disabled={!fields.title.trim()} variant={built ? "default" : "outline"} onClick={event => {
      if (!built) { setBuilt(true); return; }
      const rect = event.currentTarget.getBoundingClientRect();
      setOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }}>{built ? "Preview achievement ceremony" : "Build practice goal"}</Button>
    <DialogPrimitive.Root open={Boolean(origin)} onOpenChange={open => { if (!open) closePreview(); }}>
      {origin && <EarnedCeremony fields={fields} target={Number(fields.target_count)} reward="" still={still} grand origin={origin} preview onClose={closePreview} />}
    </DialogPrimitive.Root>
  </div>;
}
