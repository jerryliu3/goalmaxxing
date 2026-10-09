"use client";

import { format, parseISO } from "date-fns";
import { useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  PUBLIC_PROFILE_BIO_LIMIT,
  PUBLIC_PROFILE_RECORD_LIMIT,
  type PublicProfileIdentity,
  type PublicProfileOverallStats,
  type PublicProfileShowcaseRecord,
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
import { useMediaQuery } from "@/lib/ui/use-media-query";
import "@/features/goals/tempo-goal-creation.css";
import styles from "./profile-membership-card.module.css";

const PEARL = MATERIALS.find((material) => material.id === "pearl")!;
const PEARL_COLOR = "#c4b089";

export type ProfileMembershipEditor = {
  username: string;
  displayName: string;
  avatarUrl: string;
  saving: boolean;
  canSave: boolean;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSave: () => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => void;
  onBioChange?: (bio: string) => void;
  onEditRecords?: () => void;
};

function Horizon() {
  return (
    <svg className={styles.horizon} viewBox="0 0 280 190" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">
      <circle cx="140" cy="91" r="88" stroke="currentColor" strokeWidth=".7" />
      <circle cx="140" cy="91" r="76" stroke="currentColor" strokeWidth=".7" strokeDasharray="1.4 6" />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${139 + i * 7} Q70 ${92 + i * 9} 140 ${136 + i * 6} T280 ${120 + i * 9}`}
          stroke="currentColor"
          opacity={0.15 + i * 0.055}
          strokeWidth=".7"
        />
      ))}
    </svg>
  );
}

function formatMemberNo(memberNumber: number) {
  return `NO. ${String(memberNumber).padStart(5, "0")}`;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <span className={styles.metric}>
      <strong>
        <SolidLettering>{value}</SolidLettering>
      </strong>
      <span>{label}</span>
    </span>
  );
}

/** Pinned records fill the metric row; the owner taps the row to choose them. */
function RecordMetrics({
  records,
  onEdit,
}: {
  records: readonly PublicProfileShowcaseRecord[];
  onEdit?: () => void;
}) {
  const slots = onEdit ? PUBLIC_PROFILE_RECORD_LIMIT : records.length;
  const style = { gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` };
  const cells = Array.from({ length: slots }, (_, index) => {
    const record = records[index];
    return record ? (
      <Metric key={record.ref} value={record.value} label={record.label} />
    ) : (
      <Metric key={`empty-${index}`} value="—" label="Add a record" />
    );
  });

  if (!onEdit) {
    return (
      <div className={styles.metrics} style={style}>
        {cells}
      </div>
    );
  }
  return (
    <button
      type="button"
      className={`${styles.metrics} ${styles.metricsEdit}`}
      style={style}
      aria-label="Choose records"
      onClick={onEdit}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {cells}
    </button>
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toLowerCase();
  }
  return name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toLowerCase() || "gm";
}

function formatMemberSince(createdAt: string | null) {
  const dateOnly = createdAt?.slice(0, 10);
  if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }
  return format(parseISO(dateOnly), "MMMM yyyy").toUpperCase();
}

function InlineField({
  label,
  value,
  rest,
  inputClassName,
  multiline = false,
  maxLength,
  transform,
  onChange,
  onEditingChange,
}: {
  label: string;
  value: string;
  rest: ReactNode;
  inputClassName?: string;
  multiline?: boolean;
  maxLength?: number;
  transform?: (next: string) => string;
  onChange?: (next: string) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);

  const setLive = (next: boolean) => {
    setEditing(next);
    onEditingChange?.(next);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (!onChange) {
    return rest;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={styles.quiet}
        aria-label={`Edit ${label}`}
        onClick={() => setLive(true)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {rest}
      </button>
    );
  }

  const fieldProps = {
    ref: inputRef,
    "aria-label": label,
    className: `${styles.compose} ${inputClassName ?? ""}`,
    value,
    maxLength,
    onPointerDown: (event: ReactPointerEvent) => event.stopPropagation(),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(transform ? transform(event.target.value) : event.target.value),
    onBlur: () => setLive(false),
    onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
  };
  return multiline ? <textarea rows={3} {...fieldProps} /> : <input {...fieldProps} />;
}

function Portrait({
  avatarUrl,
  initials,
  onOpen,
}: {
  avatarUrl: string | null;
  initials: string;
  onOpen?: () => void;
}) {
  const inner = avatarUrl ? (
    // The control names the photo; keep the image decorative.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" draggable={false} className={styles.portraitImage} />
  ) : (
    <span className={styles.monogram}>{initials}</span>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        className={styles.portrait}
        data-portrait=""
        aria-label="Change profile photo"
        onClick={onOpen}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {inner}
      </button>
    );
  }

  return <div className={styles.portrait} data-portrait="">{inner}</div>;
}

export function ProfileMembershipCard({
  profile,
  overallStats,
  currentLevel,
  bio = "",
  records = [],
  editor,
}: {
  profile: PublicProfileIdentity;
  overallStats: PublicProfileOverallStats | null;
  currentLevel: number | null;
  bio?: string;
  records?: readonly PublicProfileShowcaseRecord[];
  editor?: ProfileMembershipEditor;
}) {
  const reducedMotion = useReducedMotion();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fieldEditing, setFieldEditing] = useState(false);
  const wide = useMediaQuery("(min-width: 720px)");

  if (!editor && profile.isPrivate) {
    return null;
  }

  const privateArch = profile.visibility === "private" || (profile.visibility === undefined && profile.isPrivate);
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
  const memberNo =
    profile.memberNumber != null && profile.memberNumber > 0
      ? formatMemberNo(profile.memberNumber)
      : null;
  const handle = username.trim() ? `@${username.trim()}` : "Goalmaxxing member";
  const showBio = bio.trim().length > 0 || Boolean(editor?.onBioChange);
  const showRecords = records.length > 0 || Boolean(editor?.onEditRecords);

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
        still={Boolean(reducedMotion) || fieldEditing || photoOpen}
        layout={wide ? "landscape" : "portrait"}
        label={`${title} membership card`}
        embedded
        controls={false}
      >
        <div className={`tempo-card-frame ${styles.frame}`}>
          <article className={`tempo-card ${styles.face}`} aria-label={`${title} membership card`}>
            <div className={`${styles.micro} ${styles.topbar}`}>
              <span>GOALMAXXING / MEMBER</span>
              {memberSince ? <span>MEMBER SINCE {memberSince}</span> : null}
            </div>
            <div className={styles.identityArt} data-profile-visibility={privateArch ? "private" : "public"}>
              <div className={styles.horizonWrap} data-horizon-frame="">
                {privateArch ? <span className={styles.cameoHalo} aria-hidden="true" /> : <Horizon />}
                <Portrait
                  avatarUrl={avatarUrl}
                  initials={monogram}
                  onOpen={editor ? () => setPhotoOpen(true) : undefined}
                />
                {privateArch ? <span className={styles.cameoSeal} aria-hidden="true">G</span> : null}
              </div>
              {privateArch ? <span className={styles.privateStatus}>PRIVATE PROFILE</span> : null}
              {memberNo ? <span className={styles.serial}>{memberNo}</span> : null}
            </div>
            <div className={styles.titleBlock}>
              <InlineField
                label="username"
                value={username}
                transform={(next) => next.trim().toLowerCase()}
                onChange={editor?.onUsernameChange}
                onEditingChange={setFieldEditing}
                inputClassName={styles.handleCompose}
                rest={<span className={styles.kicker}>{handle}</span>}
              />
              <h2>
                <InlineField
                  label="display name"
                  value={displayName}
                  onChange={editor?.onDisplayNameChange}
                  onEditingChange={setFieldEditing}
                  inputClassName={styles.titleCompose}
                  rest={<SolidLettering>{title}</SolidLettering>}
                />
              </h2>
              {showBio ? (
                <p className={styles.bio}>
                  <InlineField
                    label="bio"
                    value={bio}
                    multiline
                    maxLength={PUBLIC_PROFILE_BIO_LIMIT}
                    onChange={editor?.onBioChange}
                    onEditingChange={setFieldEditing}
                    inputClassName={styles.bioCompose}
                    rest={
                      <span className={styles.bioText}>
                        {bio.trim() || "Add a line about what you’re working toward."}
                      </span>
                    }
                  />
                </p>
              ) : null}
              {editor?.canSave ? (
                <button
                  type="button"
                  className={styles.save}
                  onClick={() => void editor.onSave()}
                  disabled={editor.saving}
                >
                  {editor.saving ? "SAVING" : "SAVE"}
                </button>
              ) : null}
            </div>
            {showRecords ? (
              <RecordMetrics records={records} onEdit={editor?.onEditRecords} />
            ) : overallStats ? (
              <div className={styles.metrics}>
                <Metric value={String(overallStats.totalGoalsCompleted)} label="goals completed" />
                <Metric value={String(overallStats.totalActivities)} label="activities" />
                {currentLevel != null ? (
                  <Metric value={String(currentLevel)} label="level" />
                ) : (
                  <Metric value={String(overallStats.activeStreakWeeks)} label="week streak" />
                )}
              </div>
            ) : null}
          </article>
        </div>
      </MaterialStage>
      {editor ? (
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <DialogContent className="z-[90]" overlayClassName="z-[90]">
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
