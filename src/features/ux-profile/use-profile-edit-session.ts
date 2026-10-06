"use client";

import { useState } from "react";
import type { ProfileMembershipEditor } from "@/features/social/profile-membership-card";
import type { ProfileDraft, ProfileSnapshot } from "@/features/ux-profile/model";
import { OWNER_EMAIL } from "@/features/ux-profile/seed";
import { useProfileDraft } from "@/features/ux-profile/use-profile-draft";
import { isValidPublicProfileUsername } from "@/lib/social/public-profile-username";

interface IdentityFields {
  username: string;
  displayName: string;
  avatarUrl: string;
}

interface Snapshot {
  draft: ProfileDraft;
  identity: IdentityFields;
}

/**
 * E's in-place editor: the shared profile draft plus the card's identity
 * fields, with Edit / Done / Cancel. Editing snapshots both so Cancel can
 * discard; Done keeps the edits. Nothing is persisted.
 */
export function useProfileEditSession(profile: ProfileSnapshot) {
  const { draft, pinNotice, actions } = useProfileDraft();
  const [identity, setIdentity] = useState<IdentityFields>(() => ({
    username: profile.identity.username ?? "",
    displayName: profile.identity.displayName ?? "",
    avatarUrl: profile.identity.avatarUrl ?? "",
  }));
  const [saved, setSaved] = useState<Snapshot | null>(null);

  const editing = saved !== null;
  const canFinish = isValidPublicProfileUsername(identity.username);

  const session = {
    start: () => setSaved({ draft, identity }),
    done: () => setSaved(null),
    cancel: () => {
      if (!saved) return;
      actions.restore(saved.draft);
      setIdentity(saved.identity);
      setSaved(null);
    },
  };

  const liveProfile: ProfileSnapshot = {
    ...profile,
    identity: {
      ...profile.identity,
      username: identity.username.trim() || null,
      displayName: identity.displayName.trim() || null,
      avatarUrl: identity.avatarUrl.trim() || null,
    },
  };

  // Production's editor contract; Done replaces the card's own Save button.
  const cardEditor: ProfileMembershipEditor = {
    username: identity.username,
    displayName: identity.displayName,
    email: OWNER_EMAIL,
    avatarUrl: identity.avatarUrl,
    saving: false,
    canSave: false,
    onUsernameChange: (username) => setIdentity((current) => ({ ...current, username })),
    onDisplayNameChange: (displayName) => setIdentity((current) => ({ ...current, displayName })),
    onSave: async () => undefined,
    onUploadAvatar: async (file) => {
      const avatarUrl = URL.createObjectURL(file);
      setIdentity((current) => ({ ...current, avatarUrl }));
    },
    onRemoveAvatar: () => setIdentity((current) => ({ ...current, avatarUrl: "" })),
  };

  return { profile: liveProfile, draft, pinNotice, actions, editing, canFinish, session, cardEditor };
}
