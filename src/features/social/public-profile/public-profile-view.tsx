"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PencilLine } from "lucide-react";
import {
  PUBLIC_PROFILE_PIN_LIMIT,
  type PublicProfileBundle,
  type PublicProfileCurrentGoal,
} from "@cadence/shared/social/public-profile";
import { UserAvatar } from "@/components/user-avatar";
import { GoalProgressCard } from "@/features/goals/goal-progress-card";
import { hydratePublicCurrentGoal } from "@/features/insights/folio/current-goal-grid";
import {
  ProfileMembershipCard,
  type ProfileMembershipEditor,
} from "@/features/social/profile-membership-card";
import { ProfileLink } from "@/features/social/public-profile/profile-link";
import {
  pinKey,
  resolveProfileContent,
  type PublicProfileContent,
  type PublicProfileDraft,
} from "@/features/social/public-profile/profile-draft";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import {
  EmptyPinSlot,
  ShowcaseTile,
  showcaseItemName,
} from "@/features/social/public-profile/showcase-tile";
import { buildPublicProfilePath } from "@/lib/social/public-profile-username";

export interface PublicProfileOwnerControls {
  draft: PublicProfileDraft;
  cardEditor: ProfileMembershipEditor;
  onBioChange: (bio: string) => void;
  onEditRecords: () => void;
  onEditPins: () => void;
  onChooseGoals: () => void;
}

/**
 * The one public profile. `/user/[username]`, the profile sheet, and the
 * Settings box all render it. Owner controls only layer affordances on top of
 * the visitor render; private and unfeatured goals are dropped before render.
 */
export function PublicProfileView({
  bundle,
  variant = "full",
  owner,
  copyLink = false,
  xpEnabled = true,
}: {
  bundle: PublicProfileBundle;
  variant?: "full" | "compact";
  owner?: PublicProfileOwnerControls;
  copyLink?: boolean;
  xpEnabled?: boolean;
}) {
  const content = resolveProfileContent(bundle, owner?.draft ?? null);
  const showcase = xpEnabled ? content.showcase : content.showcase.filter((item) => item.kind !== "medal");
  const level = xpEnabled ? bundle.xp?.currentLevel ?? null : null;
  const username = bundle.profile.username;

  if (bundle.profile.isPrivate) {
    return (
      <div className="space-y-3">
        <CompactIdentity bundle={bundle} level={null} />
        <p className="text-sm text-muted-foreground">This account is private</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="space-y-4" role="region" aria-label={`${resolvePublicProfileLabel(bundle.profile)} public profile`}>
        <CompactIdentity bundle={bundle} level={level} />
        {content.bio.trim() ? <p className="text-sm leading-snug">{content.bio}</p> : null}
        {content.records.length > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Records">
            {content.records.map((record) => (
              <li key={record.ref} className="text-xs text-muted-foreground">
                <span className="type-figure text-sm text-foreground">{record.value}</span> {record.label}
              </li>
            ))}
          </ul>
        ) : null}
        {showcase.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2" aria-label="Pinned">
            {showcase.map((item) => (
              <li key={pinKey(item)}>
                <ShowcaseTile item={item} size="compact" />
              </li>
            ))}
          </ul>
        ) : null}
        {content.goals.length > 0 ? (
          <div>
            <p className="mb-2 type-eyebrow text-[10px] text-muted-foreground">Working on</p>
            <GoalCards goals={content.goals} size="mini" />
          </div>
        ) : null}
        {username ? (
          <Link href={buildPublicProfilePath(username)} className="inline-block text-sm font-semibold underline-offset-4 hover:underline">
            View full profile
          </Link>
        ) : null}
      </div>
    );
  }

  const editing = Boolean(owner);
  const showShowcase = editing || showcase.length > 0;
  const showGoals = editing || content.goals.length > 0;

  return (
    <div className="space-y-8">
      <ProfileMembershipCard
        profile={bundle.profile}
        overallStats={null}
        currentLevel={level}
        bio={content.bio}
        records={content.records}
        editor={
          owner
            ? { ...owner.cardEditor, onBioChange: owner.onBioChange, onEditRecords: owner.onEditRecords }
            : undefined
        }
      />

      {username ? <ProfileLink username={username} copyable={copyLink} className="-mt-4" /> : null}

      {showShowcase ? (
        <Section title="Showcase" meta={editing ? `${showcase.length}/${PUBLIC_PROFILE_PIN_LIMIT} pinned` : undefined}>
          <ul className="grid gap-3 sm:grid-cols-3" aria-label="Pinned">
            {Array.from({ length: editing ? PUBLIC_PROFILE_PIN_LIMIT : showcase.length }, (_, index) => {
              const item = showcase[index];
              return (
                <li key={item ? pinKey(item) : `empty-${index}`}>
                  {owner ? (
                    <PinSlotButton item={item} onClick={owner.onEditPins} />
                  ) : (
                    <ShowcaseTile item={item!} />
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {showGoals ? (
        <Section
          title="Current goals"
          meta={editing ? `${content.goals.length} featured` : undefined}
          action={
            owner ? (
              <button
                type="button"
                onClick={owner.onChooseGoals}
                className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-semibold"
              >
                Choose goals
              </button>
            ) : null
          }
        >
          {content.goals.length > 0 ? (
            <GoalCards goals={content.goals} size="full" />
          ) : (
            <EmptyPinSlot hint="Feature a current goal so visitors see what you’re working on" />
          )}
        </Section>
      ) : null}
    </div>
  );
}

function CompactIdentity({ bundle, level }: { bundle: PublicProfileBundle; level: number | null }) {
  const label = resolvePublicProfileLabel(bundle.profile);
  const handle = bundle.profile.username ? `@${bundle.profile.username}` : null;
  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        avatarUrl={bundle.profile.avatarUrl}
        displayName={bundle.profile.displayName}
        username={bundle.profile.username}
        size="lg"
        alt=""
      />
      <div className="min-w-0 flex-1">
        <p className="truncate type-title text-lg leading-tight">{label}</p>
        {handle || level !== null ? (
          <p className="type-figure text-xs text-muted-foreground">
            {[handle, level !== null ? `Lv ${level}` : null].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  meta,
  action,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h3 className="type-eyebrow text-[10px] text-muted-foreground">{title}</h3>
          {meta ? <span className="type-figure text-[11px] text-muted-foreground">{meta}</span> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Full cards fill columns about as wide as the Goals tab's, at any container width. */
function GoalCards({ goals, size }: { goals: readonly PublicProfileCurrentGoal[]; size: "full" | "mini" }) {
  return (
    <ul
      aria-label="Goal cards"
      className={
        size === "full"
          ? "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-4 gap-y-6"
          : "grid grid-cols-3 gap-x-3 gap-y-4"
      }
    >
      {goals.map((dto) => {
        const { goal, progress } = hydratePublicCurrentGoal(dto);
        return (
          <li key={goal.id} aria-label={goal.title} className="min-w-0">
            <GoalProgressCard goal={goal} progress={progress} gallery />
          </li>
        );
      })}
    </ul>
  );
}

function PinSlotButton({
  item,
  onClick,
}: {
  item: PublicProfileContent["showcase"][number] | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item ? `Change pin: ${showcaseItemName(item)}` : "Add a pin"}
      className="relative block h-full w-full rounded-[14px] text-left outline-none ring-primary transition hover:ring-2 focus-visible:ring-2"
    >
      {item ? <ShowcaseTile item={item} /> : <EmptyPinSlot hint="Pin a medal or finished goal" />}
      {item ? (
        <span
          aria-hidden
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold"
        >
          <PencilLine className="size-3" />
          Change
        </span>
      ) : null}
    </button>
  );
}
