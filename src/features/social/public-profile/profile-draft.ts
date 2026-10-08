import {
  PUBLIC_PROFILE_PIN_LIMIT,
  PUBLIC_PROFILE_RECORD_LIMIT,
  type PublicProfileBundle,
  type PublicProfileCurrentGoal,
  type PublicProfileShowcaseItem,
  type PublicProfileShowcasePin,
  type PublicProfileShowcaseRecord,
} from "@cadence/shared/social/public-profile";

export interface PublicProfileDraft {
  bio: string;
  pins: PublicProfileShowcasePin[];
  featuredGoalIds: string[];
}

export interface PublicProfileContent {
  bio: string;
  /** Pinned records, shown on the membership card. */
  records: PublicProfileShowcaseRecord[];
  /** Pinned medals and finished goals. */
  showcase: ShowcasePinItem[];
  goals: PublicProfileCurrentGoal[];
}

export const pinKey = (pin: PublicProfileShowcasePin) => `${pin.kind}:${pin.ref}`;

const isRecordPin = (pin: PublicProfileShowcasePin) => pin.kind === "record";

type ShowcasePinItem = Exclude<PublicProfileShowcaseItem, PublicProfileShowcaseRecord>;

function splitPinned(items: readonly PublicProfileShowcaseItem[]) {
  return {
    records: items.filter((item): item is PublicProfileShowcaseRecord => item.kind === "record"),
    showcase: items.filter((item): item is ShowcasePinItem => item.kind !== "record"),
  };
}

function isVisibleGoal(goal: PublicProfileCurrentGoal) {
  return !goal.isPrivate && goal.featuredOnProfile;
}

export function draftFromBundle(bundle: PublicProfileBundle): PublicProfileDraft {
  return {
    bio: bundle.bio ?? "",
    pins: bundle.showcase.map(({ kind, ref }) => ({ kind, ref })),
    featuredGoalIds: bundle.currentGoals.filter(isVisibleGoal).map((goal) => goal.id),
  };
}

/**
 * What a visitor sees: the saved profile, or the owner's draft while editing.
 * Private goals are dropped here too, whatever the draft says.
 */
export function resolveProfileContent(
  bundle: PublicProfileBundle,
  draft: PublicProfileDraft | null
): PublicProfileContent {
  if (!draft) {
    return {
      bio: bundle.bio ?? "",
      ...splitPinned(bundle.showcase),
      goals: bundle.currentGoals.filter(isVisibleGoal),
    };
  }
  const catalog = bundle.showcaseCatalog;
  const items = catalog ? [...catalog.medals, ...catalog.goals, ...catalog.records] : bundle.showcase;
  const byKey = new Map(items.map((item) => [pinKey(item), item]));
  const featured = new Set(draft.featuredGoalIds);
  return {
    bio: draft.bio,
    ...splitPinned(draft.pins.flatMap((pin) => byKey.get(pinKey(pin)) ?? [])),
    goals: bundle.currentGoals.filter((goal) => !goal.isPrivate && featured.has(goal.id)),
  };
}

export function togglePin(
  pins: readonly PublicProfileShowcasePin[],
  pin: PublicProfileShowcasePin
): { pins: PublicProfileShowcasePin[]; notice: string | null } {
  const key = pinKey(pin);
  if (pins.some((current) => pinKey(current) === key)) {
    return { pins: pins.filter((current) => pinKey(current) !== key), notice: null };
  }
  const record = isRecordPin(pin);
  const limit = record ? PUBLIC_PROFILE_RECORD_LIMIT : PUBLIC_PROFILE_PIN_LIMIT;
  if (pins.filter((current) => isRecordPin(current) === record).length >= limit) {
    return {
      pins: [...pins],
      notice: record
        ? `Your card shows ${limit} records. Remove one to add another.`
        : `You can pin ${limit}. Unpin one to add another.`,
    };
  }
  return { pins: [...pins, { kind: pin.kind, ref: pin.ref }], notice: null };
}

export function toggleFeaturedGoal(goalIds: readonly string[], goalId: string) {
  return goalIds.includes(goalId)
    ? goalIds.filter((id) => id !== goalId)
    : [...goalIds, goalId];
}

/** Arguments for `update_public_profile`: only flags that actually change. */
export function buildPublicProfileUpdate(bundle: PublicProfileBundle, draft: PublicProfileDraft) {
  const featured = new Set(draft.featuredGoalIds);
  const publicGoals = bundle.currentGoals.filter((goal) => !goal.isPrivate);
  return {
    p_bio: draft.bio.trim(),
    p_pins: draft.pins.map(({ kind, ref }) => ({ kind, ref })),
    p_featured_goal_ids: publicGoals
      .filter((goal) => featured.has(goal.id) && !goal.featuredOnProfile)
      .map((goal) => goal.id),
    p_hidden_goal_ids: publicGoals
      .filter((goal) => !featured.has(goal.id) && goal.featuredOnProfile)
      .map((goal) => goal.id),
  };
}

export function isProfileDraftDirty(bundle: PublicProfileBundle, draft: PublicProfileDraft) {
  const update = buildPublicProfileUpdate(bundle, draft);
  return (
    update.p_bio !== (bundle.bio ?? "") ||
    update.p_featured_goal_ids.length > 0 ||
    update.p_hidden_goal_ids.length > 0 ||
    update.p_pins.map(pinKey).join("|") !== bundle.showcase.map(pinKey).join("|")
  );
}
