"use client";

import { useState, type ReactNode } from "react";
import { EyeOff, Lock, PencilLine } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileMembershipCard } from "@/features/social/profile-membership-card";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import { GAZETTEER_CATEGORY_COLORS } from "@/lib/brand/gazetteer";
import {
  BIO_LIMIT,
  canSee,
  PIN_LIMIT,
  profileGoals,
  resolvePins,
  type ProfileDraft,
  type ProfileGoal,
  type ProfileGoalState,
  type ProfileSection,
  type ProfileSnapshot,
  type Viewer,
} from "@/features/ux-profile/model";
import { EmptyPinSlot, ShowcaseTile } from "@/features/ux-profile/showcase-tiles";

export interface OwnerAffordances {
  onBioChange?: (bio: string) => void;
  /** Extra controls in each section header (edit buttons, audience switches). */
  sectionAction?: (section: ProfileSection) => ReactNode;
}

/**
 * The one public profile. Visitors and owners get the same render; owner mode
 * only layers affordances on top. Everything a visitor must not see is dropped
 * here, so no concept can leak it by forgetting a check.
 */
export function PublicProfileView({
  profile,
  draft,
  viewer,
  variant = "full",
  owner,
}: {
  profile: ProfileSnapshot;
  draft: ProfileDraft;
  viewer: Viewer;
  variant?: "full" | "compact";
  owner?: OwnerAffordances;
}) {
  const isOwner = viewer === "owner";
  const affordances = isOwner ? owner : undefined;
  const pinned = resolvePins(draft.pins, profile.catalog);
  const goals = profileGoals(profile.goals, draft.featuredGoalIds, viewer);
  const shows = (section: ProfileSection) => canSee(draft.audience[section], viewer);
  const showBio = shows("bio") && (isOwner || draft.bio.trim().length > 0);
  const showShowcase = shows("showcase") && (isOwner || pinned.length > 0);
  const showGoals = shows("goals") && goals.length > 0;

  if (variant === "compact") {
    const label = resolvePublicProfileLabel(profile.identity);
    const workingOn = goals.filter((row) => row.state === "shown").map((row) => row.goal.title);
    return (
      <div className="space-y-3" aria-label={`${label} public profile`} role="region">
        <div className="flex items-center gap-3">
          <UserAvatar
            avatarUrl={profile.identity.avatarUrl}
            displayName={profile.identity.displayName}
            username={profile.identity.username}
            size="lg"
            alt=""
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold leading-tight">{label}</p>
            <p className="font-mono text-xs text-muted-foreground">
              @{profile.identity.username} · Lv {profile.level}
            </p>
          </div>
        </div>
        {showBio ? <p className="line-clamp-2 text-sm leading-snug">{draft.bio}</p> : null}
        {showShowcase ? (
          <ul className="grid grid-cols-3 gap-2" aria-label="Pinned">
            {Array.from({ length: PIN_LIMIT }, (_, index) => {
              const item = pinned[index];
              if (!item && !isOwner) return null;
              return (
                <li key={item?.id ?? `empty-${index}`}>
                  {item ? <ShowcaseTile item={item} size="compact" /> : <EmptyPinSlot size="compact" hint="Empty" />}
                </li>
              );
            })}
          </ul>
        ) : null}
        {showGoals && workingOn.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Working on <span className="text-foreground">{workingOn.join(" · ")}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileMembershipCard
        profile={profile.identity}
        overallStats={profile.stats}
        currentLevel={profile.level}
      />

      {showBio ? (
        <Section title="About" action={affordances?.sectionAction?.("bio")}>
          <Bio bio={draft.bio} onChange={affordances?.onBioChange} />
        </Section>
      ) : null}

      {showShowcase ? (
        <Section
          title="Showcase"
          meta={isOwner ? `${pinned.length}/${PIN_LIMIT} pinned` : undefined}
          action={affordances?.sectionAction?.("showcase")}
        >
          <ul className="grid gap-3 sm:grid-cols-3" aria-label="Pinned">
            {Array.from({ length: PIN_LIMIT }, (_, index) => {
              const item = pinned[index];
              if (!item && !isOwner) return null;
              return (
                <li key={item?.id ?? `empty-${index}`}>
                  {item ? (
                    <ShowcaseTile item={item} />
                  ) : (
                    <EmptyPinSlot hint="Pin a medal, record, or finished goal" />
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {showGoals ? (
        <Section title="Current goals" action={affordances?.sectionAction?.("goals")}>
          <ul className="divide-y divide-border/70 rounded-[14px] border border-border/80 bg-card">
            {goals.map(({ goal, state }) => (
              <GoalRow key={goal.id} goal={goal} state={state} />
            ))}
          </ul>
        </Section>
      ) : null}
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
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </h3>
          {meta ? <span className="font-mono text-[11px] text-muted-foreground">{meta}</span> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Bio({ bio, onChange }: { bio: string; onChange?: (bio: string) => void }) {
  const [editing, setEditing] = useState(false);

  if (onChange && editing) {
    return (
      <div className="space-y-2">
        <textarea
          aria-label="Bio"
          autoFocus
          rows={2}
          maxLength={BIO_LIMIT}
          value={bio}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setEditing(false)}
          className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 font-display text-lg leading-snug outline-none focus:border-primary"
        />
        <p className="text-right font-mono text-[11px] text-muted-foreground">
          {bio.length}/{BIO_LIMIT}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <p className="flex-1 font-display text-xl leading-snug">
        {bio.trim() || <span className="text-muted-foreground">Add a line about what you’re working toward.</span>}
      </p>
      {onChange ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold"
        >
          <PencilLine aria-hidden className="size-3.5" />
          Edit bio
        </button>
      ) : null}
    </div>
  );
}

const GOAL_STATE_BADGE: Record<Exclude<ProfileGoalState, "shown">, { label: string; icon: typeof Lock }> = {
  hidden: { label: "Not featured", icon: EyeOff },
  private: { label: "Private · only you", icon: Lock },
};

function GoalRow({ goal, state }: { goal: ProfileGoal; state: ProfileGoalState }) {
  const badge = state === "shown" ? null : GOAL_STATE_BADGE[state];
  const BadgeIcon = badge?.icon;
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${badge ? "opacity-60" : ""}`}>
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: GAZETTEER_CATEGORY_COLORS[goal.category] }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{goal.title}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{goal.cadence}</p>
      </div>
      {badge ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          {BadgeIcon ? <BadgeIcon aria-hidden className="size-3" /> : null}
          {badge.label}
        </span>
      ) : (
        <span
          role="img"
          aria-label={`${Math.round(goal.progress * 100)}% this period`}
          className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        >
          <span className="block h-full rounded-full bg-primary" style={{ width: `${goal.progress * 100}%` }} />
        </span>
      )}
    </li>
  );
}
