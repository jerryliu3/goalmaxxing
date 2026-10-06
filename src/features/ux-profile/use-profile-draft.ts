"use client";

import { useState } from "react";
import {
  BIO_LIMIT,
  PIN_LIMIT,
  togglePin,
  type Audience,
  type ProfileDraft,
  type ProfileSection,
} from "@/features/ux-profile/model";
import { INITIAL_DRAFT } from "@/features/ux-profile/seed";

/** Local, seeded owner state shared by every concept. Nothing is persisted. */
export function useProfileDraft(initial: ProfileDraft = INITIAL_DRAFT) {
  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [pinNotice, setPinNotice] = useState<string | null>(null);

  const actions = {
    setBio(bio: string) {
      setDraft((current) => ({ ...current, bio: bio.slice(0, BIO_LIMIT) }));
    },
    togglePin(id: string) {
      const result = togglePin(draft.pins, id);
      setPinNotice(
        result.blocked
          ? `Your profile shows ${PIN_LIMIT}. Unpin one to make room.`
          : null
      );
      if (!result.blocked) {
        setDraft((current) => ({ ...current, pins: result.pins }));
      }
    },
    toggleFeaturedGoal(id: string) {
      setDraft((current) => ({
        ...current,
        featuredGoalIds: current.featuredGoalIds.includes(id)
          ? current.featuredGoalIds.filter((goalId) => goalId !== id)
          : [...current.featuredGoalIds, id],
      }));
    },
    setAudience(section: ProfileSection, audience: Audience) {
      setDraft((current) => ({
        ...current,
        audience: { ...current.audience, [section]: audience },
      }));
    },
  };

  return { draft, pinNotice, actions };
}
