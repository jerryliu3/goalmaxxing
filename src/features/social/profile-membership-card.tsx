"use client";

import { format, parseISO } from "date-fns";
import { Sparkles, WandSparkles } from "lucide-react";
import { useRef, useState } from "react";
import type {
  PublicProfileIdentity,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { MaterialStage } from "@/features/ux-brand/card-materials/material-stage";
import { MATERIALS } from "@/features/ux-brand/card-materials/materials";
import { SolidLettering } from "@/features/ux-brand/card-materials/solid-lettering";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import "@/features/goals/tempo-goal-creation.css";
import styles from "./profile-membership-card.module.css";

const PEARL = MATERIALS.find((material) => material.id === "pearl")!;
const PEARL_COLOR = "#c4b089";

export type ProfileMembershipEditor = {
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  saving: boolean;
  canSave: boolean;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSave: () => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => void;
};

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong>
        <SolidLettering>{value}</SolidLettering>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "GM";
}

function formatMemberSince(createdAt: string | null) {
  const dateOnly = createdAt?.slice(0, 10);
  if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }
  return format(parseISO(dateOnly), "MMMM yyyy").toUpperCase();
}

function IdentityPhoto({
  avatarUrl,
  initials,
  handle,
  onOpen,
}: {
  avatarUrl: string | null;
  initials: string;
  handle: string;
  onOpen?: () => void;
}) {
  const inner = (
    <>
      {avatarUrl ? (
        // Photo is named by the button; keep the image decorative.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className={styles.photoImage} />
      ) : (
        <span className={styles.photoFallback}>{initials}</span>
      )}
      <span className={styles.serial}>{handle.toUpperCase()}</span>
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        className={styles.photo}
        aria-label="Change profile photo"
        onClick={onOpen}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {inner}
      </button>
    );
  }

  return <div className={styles.photo}>{inner}</div>;
}

export function ProfileMembershipCard({
  profile,
  overallStats,
  currentLevel,
  editor,
}: {
  profile: PublicProfileIdentity;
  overallStats: PublicProfileOverallStats | null;
  currentLevel: number | null;
  editor?: ProfileMembershipEditor;
}) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!editor && profile.isPrivate) {
    return null;
  }

  const username = editor?.username ?? profile.username ?? "";
  const displayName = editor?.displayName ?? profile.displayName ?? "";
  const avatarUrl = (editor?.avatarUrl ?? profile.avatarUrl ?? "").trim() || null;
  const resolvedProfile = {
    ...profile,
    username: username.trim() || null,
    displayName: displayName.trim() || null,
    avatarUrl,
  };
  const title = resolvePublicProfileLabel(resolvedProfile);
  const monogram = initialsFromName(title.replace(/^@/, ""));
  const memberSince = formatMemberSince(profile.createdAt);
  const handle = username.trim() ? `@${username.trim()}` : "Goalmaxxing member";

  const uploadSelectedFile = (file: File | undefined) => {
    if (!file || !editor) {
      return;
    }
    setUploadingAvatar(true);
    void editor.onUploadAvatar(file).finally(() => {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    });
  };

  return (
    <div className={styles.embed}>
      <MaterialStage
        material={PEARL}
        color={PEARL_COLOR}
        still
        layout="landscape"
        label={`${title} membership card`}
        embedded
        controls={false}
      >
        <div
          className={`tempo-card-frame ${styles.frame}`}
          data-editing={editor ? "true" : undefined}
        >
          <article className={`tempo-card ${styles.face}`} aria-label={`${title} membership card`}>
            <div className={styles.micro}>
              <span>GOALMAXXING / MEMBER</span>
              <Sparkles size={17} strokeWidth={1.2} />
            </div>
            <IdentityPhoto
              avatarUrl={avatarUrl}
              initials={monogram}
              handle={handle}
              onOpen={editor ? () => setPhotoOpen(true) : undefined}
            />
            <div className={styles.identity}>
              {editor ? (
                <>
                  <label className={styles.field}>
                    <span>Username</span>
                    <input
                      id="profile-username"
                      value={editor.username}
                      autoComplete="username"
                      onPointerDown={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        editor.onUsernameChange(event.target.value.trim().toLowerCase())
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Display name</span>
                    <input
                      id="profile-display-name"
                      className={styles.titleInput}
                      value={editor.displayName}
                      autoComplete="name"
                      onPointerDown={(event) => event.stopPropagation()}
                      onChange={(event) => editor.onDisplayNameChange(event.target.value)}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Email</span>
                    <input
                      id="profile-email"
                      value={editor.email}
                      readOnly
                      aria-readonly
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    className={styles.save}
                    onClick={() => void editor.onSave()}
                    disabled={editor.saving || !editor.canSave}
                  >
                    <WandSparkles className="size-4" />
                    {editor.saving ? "Saving..." : "Save profile"}
                  </Button>
                </>
              ) : (
                <>
                  <span className={styles.kicker}>{handle}</span>
                  <h2>
                    <SolidLettering>{title}</SolidLettering>
                  </h2>
                </>
              )}
            </div>
            {overallStats ? (
              <div className={styles.metrics}>
                <Metric value={String(overallStats.totalGoalsCompleted)} label="goals completed" />
                <Metric value={String(overallStats.totalActivities)} label="activities" />
                <Metric value={String(overallStats.activeStreakDays)} label="day streak" />
              </div>
            ) : null}
            <div className={styles.footer}>
              <span>PEARL RESERVE</span>
              {currentLevel != null ? <span>LEVEL {currentLevel}</span> : <span>MEMBER</span>}
              {memberSince ? (
                <span>
                  MEMBER SINCE
                  <br />
                  {memberSince}
                </span>
              ) : null}
            </div>
          </article>
        </div>
      </MaterialStage>
      {editor ? (
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profile photo</DialogTitle>
              <DialogDescription>
                Upload a new photo or remove the current one.
              </DialogDescription>
            </DialogHeader>
            <div className={styles.photoPreview}>
              <UserAvatar
                avatarUrl={avatarUrl}
                displayName={displayName || null}
                username={username || null}
                size="lg"
                alt="Profile photo preview"
              />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => uploadSelectedFile(event.target.files?.[0])}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={uploadingAvatar || editor.saving}
                onClick={() => avatarInputRef.current?.click()}
              >
                {uploadingAvatar ? "Uploading..." : "Upload photo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={uploadingAvatar || editor.saving || !avatarUrl}
                onClick={() => editor.onRemoveAvatar()}
              >
                Remove photo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
