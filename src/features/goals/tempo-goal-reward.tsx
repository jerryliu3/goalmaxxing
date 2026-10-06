"use client";

import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TempoGoalChoices as Choices } from "./tempo-goal-choices";

/** Matches the `goals.reward_text` limit. */
const REWARD_MAX_LENGTH = 500;

const REWARD_IDEAS = [
  { value: "New gear for it", label: "New gear for it" },
  { value: "A weekend away", label: "A weekend away" },
  { value: "A favourite meal out", label: "A favourite meal out" },
] as const;

/**
 * The reward step. The reward is the headline; the card beside it is turned over to its back,
 * where the advanced settings live, so this step also points there.
 */
export function TempoGoalReward({
  id,
  reward,
  onReward,
  advancedTopics,
}: {
  id: string;
  /** Undefined where the caller can't save a reward (bulk drafts): only the advanced settings show. */
  reward: string | undefined;
  onReward: (reward: string) => void;
  advancedTopics: string;
}) {
  return (
    <>
      {reward !== undefined ? (
        <>
          <label htmlFor={`${id}-reward`}>Your reward</label>
          <Input
            id={`${id}-reward`}
            className="tempo-title-input"
            placeholder="New running shoes"
            maxLength={REWARD_MAX_LENGTH}
            value={reward}
            onChange={(event) => onReward(event.target.value)}
          />
          <Choices label="Reward ideas" value={null} options={REWARD_IDEAS} onChange={onReward} />
          <p className="tempo-hint">
            Optional. It stays sealed on the back of your card until you finish.
          </p>
        </>
      ) : null}
      <div className="tempo-advanced-note">
        <RotateCcw size={16} aria-hidden="true" />
        <p>
          <strong>Advanced settings are on the back of the card</strong>
          <span className="tempo-hint">{advancedTopics}. All optional.</span>
        </p>
      </div>
    </>
  );
}
