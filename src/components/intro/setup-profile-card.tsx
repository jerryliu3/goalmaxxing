"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProfileMembershipCard } from "@/features/social/profile-membership-card";
import { getApiErrorMessage } from "@/lib/api/client";
import { PUBLIC_PROFILE_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import { markTabDataCacheStaleByPrefix } from "@/lib/cache/tab-data-cache";
import {
  getAvatarUploadValidationError,
  uploadProfileAvatar,
} from "@/lib/profile/avatar-upload";
import {
  isValidPublicProfileUsername,
  normalizePublicProfileUsername,
} from "@/lib/social/public-profile-username";
import { createClient } from "@/lib/supabase/client";

interface IdentityDraft {
  username: string;
  displayName: string;
  avatarUrl: string;
}

export function SetupProfileCard({
  userId,
  isPrivate,
  saveRef,
  onReadyChange,
}: {
  userId: string;
  isPrivate: boolean;
  saveRef: { current: () => Promise<void> };
  onReadyChange: (ready: boolean) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [origin, setOrigin] = useState<IdentityDraft | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void supabase.from("profiles").select("username, display_name, avatar_url, created_at").eq("id", userId).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setLoadError(true);
          return;
        }
        const next = {
          username: data.username ?? "",
          displayName: data.display_name ?? "",
          avatarUrl: data.avatar_url ?? "",
        };
        setCreatedAt(data.created_at);
        setDraft((current) => current ?? next);
        setOrigin((current) => current ?? next);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [supabase, userId]);

  const usernameChanged = Boolean(
    draft && origin && normalizePublicProfileUsername(draft.username) !== normalizePublicProfileUsername(origin.username)
  );
  const usernameValid = !draft || !usernameChanged || isValidPublicProfileUsername(draft.username);
  const ready = !loading && (loadError || Boolean(draft)) && usernameValid;

  useEffect(() => {
    onReadyChange(ready);
  }, [onReadyChange, ready]);

  useEffect(() => {
    saveRef.current = async () => {
      if (!draft || !origin) return;
      const username = normalizePublicProfileUsername(draft.username);
      const next = {
        username,
        display_name: draft.displayName.trim() || null,
        avatar_url: draft.avatarUrl.trim() || null,
      };
      const previous = {
        username: normalizePublicProfileUsername(origin.username),
        display_name: origin.displayName.trim() || null,
        avatar_url: origin.avatarUrl.trim() || null,
      };
      if (
        next.username === previous.username &&
        next.display_name === previous.display_name &&
        next.avatar_url === previous.avatar_url
      ) {
        return;
      }
      if (next.username !== previous.username && !isValidPublicProfileUsername(username)) {
        throw new Error("Usernames are 3–32 lowercase letters, numbers, or underscores.");
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(next.username === previous.username ? {} : { username: next.username }),
          display_name: next.display_name,
          avatar_url: next.avatar_url,
        })
        .eq("id", userId);
      if (error) throw new Error(error.message);
      markTabDataCacheStaleByPrefix(PUBLIC_PROFILE_CACHE_PREFIX);
      setOrigin(draft);
    };
  }, [draft, origin, saveRef, supabase, userId]);

  if (loadError && !draft) {
    return <p className="text-sm text-muted-foreground">Your profile card will be here once it loads. You can still continue.</p>;
  }
  if (!draft) {
    return <p className="text-sm text-muted-foreground">Loading your profile…</p>;
  }

  return (
    <div className="space-y-3">
      <ProfileMembershipCard
        profile={{
          subjectUserId: userId,
          username: draft.username.trim() || null,
          displayName: draft.displayName.trim() || null,
          avatarUrl: draft.avatarUrl.trim() || null,
          isPrivate,
          createdAt,
        }}
        overallStats={null}
        currentLevel={null}
        editor={{
          username: draft.username,
          displayName: draft.displayName,
          avatarUrl: draft.avatarUrl,
          saving: false,
          canSave: false,
          onUsernameChange: (username) => setDraft((current) => current && { ...current, username }),
          onDisplayNameChange: (displayName) => setDraft((current) => current && { ...current, displayName }),
          onSave: async () => {},
          onUploadAvatar: async (file) => {
            const validationError = getAvatarUploadValidationError(file);
            if (validationError) {
              toast.error(validationError);
              return;
            }
            try {
              const avatarUrl = await uploadProfileAvatar({ supabase, userId, file });
              setDraft((current) => current && { ...current, avatarUrl });
              toast.success("Photo uploaded. Continue to keep it.");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Avatar upload failed."));
            }
          },
          onRemoveAvatar: () => setDraft((current) => current && { ...current, avatarUrl: "" }),
        }}
      />
      {!usernameValid ? (
        <p role="alert" className="text-xs font-semibold text-primary">
          Usernames are 3–32 lowercase letters, numbers, or underscores.
        </p>
      ) : null}
    </div>
  );
}
