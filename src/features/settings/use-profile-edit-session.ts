"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  PUBLIC_PROFILE_BIO_LIMIT,
  type PublicProfileBundle,
  type PublicProfileShowcasePin,
} from "@cadence/shared/social/public-profile";
import type { ProfileMembershipEditor } from "@/features/social/profile-membership-card";
import {
  buildPublicProfileUpdate,
  draftFromBundle,
  isProfileDraftDirty,
  toggleFeaturedGoal,
  togglePin,
  type PublicProfileDraft,
} from "@/features/social/public-profile/profile-draft";
import { savePublicProfile } from "@/features/social/public-profile/save-public-profile";
import {
  isValidPublicProfileUsername,
  normalizePublicProfileUsername,
} from "@/lib/social/public-profile-username";
import { createClient } from "@/lib/supabase/client";

export interface IdentityDraft {
  username: string;
  display_name: string;
  avatar_url: string;
}

interface Session {
  identity: IdentityDraft;
  draft: PublicProfileDraft;
}

/**
 * Settings' in-place profile editor. Edit snapshots the identity fields and
 * the profile draft; Cancel restores them; Done saves the identity row and
 * the profile (bio, pins, featured goals) and then reloads the bundle.
 */
export function useProfileEditSession<T extends IdentityDraft>({
  bundle,
  identityDraft,
  setIdentityDraft,
  authEmail,
  identitySaving,
  canSaveIdentity,
  saveIdentity,
  uploadAvatar,
  reload,
}: {
  bundle: PublicProfileBundle | null;
  identityDraft: T;
  setIdentityDraft: Dispatch<SetStateAction<T>>;
  authEmail: string;
  identitySaving: boolean;
  canSaveIdentity: boolean;
  saveIdentity: () => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<void>;
  reload: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = session !== null;
  const usernameValid = isValidPublicProfileUsername(
    normalizePublicProfileUsername(identityDraft.username)
  );
  const busy = saving || identitySaving;

  const updateDraft = (update: (draft: PublicProfileDraft) => PublicProfileDraft) =>
    setSession((current) => (current ? { ...current, draft: update(current.draft) } : current));

  const start = () => {
    if (!bundle) return;
    setPinNotice(null);
    setSession({
      identity: {
        username: identityDraft.username,
        display_name: identityDraft.display_name,
        avatar_url: identityDraft.avatar_url,
      },
      draft: draftFromBundle(bundle),
    });
  };

  const cancel = () => {
    if (!session) return;
    setIdentityDraft((current) => ({ ...current, ...session.identity }));
    setSession(null);
  };

  const done = async () => {
    if (!session || !bundle || !usernameValid || busy) return;
    setSaving(true);
    try {
      const identityChanged = canSaveIdentity;
      if (identityChanged && !(await saveIdentity())) return;
      if (isProfileDraftDirty(bundle, session.draft)) {
        await savePublicProfile(supabase, buildPublicProfileUpdate(bundle, session.draft));
        if (!identityChanged) toast.success("Profile saved.");
      }
      reload();
      setSession(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const actions = {
    setBio: (bio: string) =>
      updateDraft((draft) => ({ ...draft, bio: bio.slice(0, PUBLIC_PROFILE_BIO_LIMIT) })),
    togglePin: (pin: PublicProfileShowcasePin) => {
      if (!session) return;
      const result = togglePin(session.draft.pins, pin);
      setPinNotice(result.notice);
      updateDraft((draft) => ({ ...draft, pins: result.pins }));
    },
    toggleFeaturedGoal: (goalId: string) =>
      updateDraft((draft) => ({
        ...draft,
        featuredGoalIds: toggleFeaturedGoal(draft.featuredGoalIds, goalId),
      })),
  };

  const cardEditor: ProfileMembershipEditor = {
    username: identityDraft.username,
    displayName: identityDraft.display_name,
    email: authEmail,
    avatarUrl: identityDraft.avatar_url,
    saving: busy,
    canSave: false,
    onUsernameChange: (username) => setIdentityDraft((current) => ({ ...current, username })),
    onDisplayNameChange: (display_name) => setIdentityDraft((current) => ({ ...current, display_name })),
    onSave: done,
    onUploadAvatar: uploadAvatar,
    onRemoveAvatar: () => setIdentityDraft((current) => ({ ...current, avatar_url: "" })),
  };

  return {
    editing,
    draft: session?.draft ?? null,
    pinNotice,
    canFinish: editing && usernameValid && !busy,
    usernameValid,
    saving: busy,
    start,
    cancel,
    done,
    actions,
    cardEditor,
  };
}
