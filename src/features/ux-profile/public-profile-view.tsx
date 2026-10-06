"use client";

import { useState, type ReactNode } from "react";
import { PencilLine } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { GoalProgressCard } from "@/features/goals/goal-progress-card";
import {
  ProfileMembershipCard,
  type ProfileMembershipEditor,
} from "@/features/social/profile-membership-card";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import {
  BIO_LIMIT,
  canSee,
  PIN_LIMIT,
  profileGoals,
  resolvePins,
  showcaseItemName,
  type ProfileDraft,
  type ProfileGoalEntry,
  type ProfileSection,
  type ProfileSnapshot,
  type ShowcaseItem,
  type Viewer,
} from "@/features/ux-profile/model";
import { ProfileLink } from "@/features/ux-profile/profile-link";
import { EmptyPinSlot, ShowcaseTile } from "@/features/ux-profile/showcase-tiles";

export interface OwnerAffordances {
  onBioChange?: (bio: string) => void;
  /** Makes every pin slot (filled or empty) a button that opens the picker. */
  onEditPins?: () => void;
  /** Extra controls in each section header (edit buttons, audience switches). */
  sectionAction?: (section: ProfileSection) => ReactNode;
  /**
   * Turns the membership card into production's editor (underlined name,
   * handle and photo fields). Without it the card is the clean read-only face.
   */
  cardEditor?: ProfileMembershipEditor;
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
  copyLink = false,
}: {
  profile: ProfileSnapshot;
  draft: ProfileDraft;
  viewer: Viewer;
  variant?: "full" | "compact";
  owner?: OwnerAffordances;
  /** Copy link for hosts that show the visitor render on the owner's own surface. */
  copyLink?: boolean;
}) {
  const isOwner = viewer === "owner";
  const affordances = isOwner ? owner : undefined;
  const pinned = resolvePins(draft.pins, profile.catalog);
  const goals = profileGoals(profile, draft.featuredGoalIds);
  const shows = (section: ProfileSection) => canSee(draft.audience[section], viewer);
  const showBio = shows("bio") && (isOwner || draft.bio.trim().length > 0);
  const showShowcase = shows("showcase") && (isOwner || pinned.length > 0);
  const showGoals = shows("goals") && (isOwner || goals.length > 0);

  if (variant === "compact") {
    const label = resolvePublicProfileLabel(profile.identity);
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
        {showGoals && goals.length > 0 ? (
          <div className="pt-1">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Working on
            </p>
            <GoalCards entries={goals} size="mini" />
          </div>
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
        editor={affordances?.cardEditor}
      />

      {profile.identity.username ? (
        <ProfileLink
          username={profile.identity.username}
          copyable={isOwner || copyLink}
          className="-mt-4"
        />
      ) : null}

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
                  {affordances?.onEditPins ? (
                    <PinSlotButton item={item} onClick={affordances.onEditPins} />
                  ) : item ? (
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
        <Section
          title="Current goals"
          meta={isOwner ? `${goals.length} featured` : undefined}
          action={affordances?.sectionAction?.("goals")}
        >
          {goals.length > 0 ? (
            <GoalCards entries={goals} size="full" />
          ) : (
            <EmptyPinSlot hint="Feature a current goal so visitors see what you’re working on" />
          )}
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

/**
 * The Goals page's card renderer (`GoalProgressCard`, as `CurrentGoalGrid`
 * uses it). The grid is container-sized rather than `CurrentGoalGrid`'s
 * viewport breakpoints, so cards stay legible inside a card or dialog.
 */
function GoalCards({ entries, size }: { entries: readonly ProfileGoalEntry[]; size: "full" | "mini" }) {
  return (
    <div className="@container">
      <ul
        aria-label="Goal cards"
        className={
          size === "full"
            ? "grid grid-cols-2 gap-x-4 gap-y-6 @xl:grid-cols-3"
            : "grid grid-cols-3 gap-x-3 gap-y-4"
        }
      >
        {entries.map(({ goal, progress }) => (
          <li key={goal.id} aria-label={goal.title} className="min-w-0">
            <GoalProgressCard goal={goal} progress={progress} gallery />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PinSlotButton({ item, onClick }: { item: ShowcaseItem | undefined; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item ? `Change pin: ${showcaseItemName(item)}` : "Add a pin"}
      className="relative block h-full w-full rounded-[14px] text-left outline-none ring-primary transition hover:ring-2 focus-visible:ring-2"
    >
      {item ? <ShowcaseTile item={item} /> : <EmptyPinSlot hint="Add a pin" />}
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
