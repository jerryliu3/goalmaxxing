import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type {
  PublicProfileIdentity,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import { selectCurrentGoals } from "@/lib/goals/current-goals";
import type { Goal } from "@/lib/goals/types";
import { buildPublicProfilePath } from "@/lib/social/public-profile-username";
import type {
  AchievementGoalCategory,
  AwardTier,
  PersonalRecordAccent,
} from "@/features/achievements/types";

/* ------------------------------------------------------------------ concepts */

export type ProfileConceptSlug =
  | "settings-preview"
  | "owner-page"
  | "settings-card"
  | "pin-from-growth"
  | "audience";

export interface ProfileConcept {
  slug: ProfileConceptSlug;
  letter: string;
  name: string;
  thesis: string;
  avatar: string;
  curation: string;
  risk: string;
  /** The current leading direction; listed first and badged on the index. */
  leading?: boolean;
}

export const PROFILE_CONCEPTS: readonly ProfileConcept[] = [
  {
    slug: "settings-preview",
    letter: "E",
    name: "Your profile, in Settings",
    leading: true,
    thesis:
      "The top of Settings is your whole public profile, exactly as visitors see it: the membership card, your link, About, Showcase and current goals. “Edit profile” turns that same box into the editor.",
    avatar: "Avatar → Settings. Its first box is your public profile; settings rows follow.",
    curation:
      "Edit profile, in place: the card gets editable name, handle and photo; inline bio; tappable pin slots; a goal chooser. Done publishes, Cancel discards.",
    risk: "Settings opens with a long profile before any setting; people who came to change notifications scroll past it every time.",
  },
  {
    slug: "owner-page",
    letter: "A",
    name: "You = your public page",
    thesis:
      "The avatar opens your public profile in owner mode. You edit it where it lives, and one toggle shows it exactly as a visitor would.",
    avatar: "Avatar → your profile (owner mode). Gear → Settings.",
    curation: "Inline: edit bio, pin from a picker drawer, choose featured goals.",
    risk: "Settings drop one level deeper; people who open the avatar to change notifications pay an extra tap.",
  },
  {
    slug: "settings-card",
    letter: "B",
    name: "Settings with a profile card",
    thesis:
      "The avatar still opens Settings, but its top is a compact rendering of what visitors see — not your stats. Preview opens the real visitor page.",
    avatar: "Avatar → Settings. Profile card → Preview sheet.",
    curation: "“Edit profile” sheet: bio, pins, featured goals.",
    risk: "Your public page is never a place you live in, so it can feel like a form rather than something to be proud of.",
  },
  {
    slug: "pin-from-growth",
    letter: "C",
    name: "Pin from where it lives",
    thesis:
      "Curation happens on the object: every medal, record, and finished plaque carries a “Show on profile” pin. The profile only renders what is pinned.",
    avatar: "Avatar → menu: View my profile · Settings · Sign out.",
    curation: "Pin toggles in Growth (medals, records) and Goals · Past (plaques), max 3.",
    risk: "Curation is spread across two tabs; nobody discovers pins unless the empty profile slots point back to them.",
  },
  {
    slug: "audience",
    letter: "D",
    name: "Audience per section",
    thesis:
      "Privacy-forward owner mode: each public section has its own audience — Everyone, Friends, or Only me — and a “View as” switch proves it.",
    avatar: "Avatar → your profile (owner mode) with audience switches.",
    curation: "Same picker as A, plus a per-section audience control.",
    risk: "Three audiences need a friend graph and RLS per section; that is real backend scope for a modest win.",
  },
] as const;

export function getProfileConcept(slug: ProfileConceptSlug): ProfileConcept {
  return PROFILE_CONCEPTS.find((concept) => concept.slug === slug)!;
}

/* ------------------------------------------------------------------ showcase */

export const PIN_LIMIT = 3;

export type ShowcaseItem =
  | {
      kind: "medal";
      id: string;
      level: number;
      tier: AwardTier;
      title: string;
      detail: string;
      date: string;
    }
  | {
      kind: "plaque";
      id: string;
      title: string;
      rewardText: string | null;
      achievedOn: string;
      category: AchievementGoalCategory;
    }
  | {
      kind: "record";
      id: string;
      label: string;
      value: string;
      hint: string;
      accent: PersonalRecordAccent;
    };

export type ShowcaseKind = ShowcaseItem["kind"];

export const SHOWCASE_KIND_LABEL: Record<ShowcaseKind, string> = {
  medal: "Medals",
  plaque: "Finished goals",
  record: "Records",
};

export function showcaseItemName(item: ShowcaseItem): string {
  return item.kind === "record" ? item.label : item.title;
}

export interface PinToggle {
  pins: readonly string[];
  blocked: boolean;
}

/** Pins in order; unpinning always works, pinning past the limit is blocked. */
export function togglePin(
  pins: readonly string[],
  id: string,
  limit: number = PIN_LIMIT
): PinToggle {
  if (pins.includes(id)) {
    return { pins: pins.filter((pin) => pin !== id), blocked: false };
  }
  if (pins.length >= limit) {
    return { pins, blocked: true };
  }
  return { pins: [...pins, id], blocked: false };
}

export function resolvePins(
  pins: readonly string[],
  catalog: readonly ShowcaseItem[]
): ShowcaseItem[] {
  return pins.flatMap((pin) => catalog.find((item) => item.id === pin) ?? []);
}

/* ------------------------------------------------------------------ audience */

export type Viewer = "owner" | "friend" | "public";
export type Audience = "everyone" | "friends" | "only-me";
export type ProfileSection = "bio" | "showcase" | "goals";

export const AUDIENCE_LABEL: Record<Audience, string> = {
  everyone: "Everyone",
  friends: "Friends",
  "only-me": "Only me",
};

export function canSee(audience: Audience, viewer: Viewer): boolean {
  if (viewer === "owner") return true;
  if (audience === "everyone") return true;
  return audience === "friends" && viewer === "friend";
}

/* ------------------------------------------------------------------ goals */

export interface ProfileGoalEntry {
  goal: Goal;
  progress: ProgressContextSummary;
}

/** Current goals the way the Goals page selects them; visitors never get private ones. */
export function currentGoals(profile: ProfileSnapshot, viewer: Viewer): ProfileGoalEntry[] {
  return selectCurrentGoals(
    [...profile.goals],
    [...profile.progress],
    profile.identity.subjectUserId,
    { publicOnly: viewer !== "owner" }
  );
}

/**
 * What any profile renders: featured current goals, never private ones. The
 * owner gets the same list (no "only you" extras); the featured-goals chooser
 * is where every current goal, private included, is listed.
 */
export function profileGoals(
  profile: ProfileSnapshot,
  featuredIds: readonly string[]
): ProfileGoalEntry[] {
  return currentGoals(profile, "public").filter((entry) => featuredIds.includes(entry.goal.id));
}

/* ------------------------------------------------------------------ profile */

/** What one loader returns for any viewer; the view filters by viewer. */
export interface ProfileSnapshot {
  identity: PublicProfileIdentity;
  stats: PublicProfileOverallStats;
  level: number;
  catalog: readonly ShowcaseItem[];
  /** Raw goals and progress summaries, as the Goals page loads them. */
  goals: readonly Goal[];
  progress: readonly ProgressContextSummary[];
}

/** Production's canonical host (`buildPublicProfileUrl`'s default). */
export const PROFILE_URL_HOST = "goalmaxxing.xyz";

/** Display URL, e.g. `goalmaxxing.xyz/user/mayaruns`; the path is production's `buildPublicProfilePath`. */
export function publicProfileUrl(username: string): string {
  return `${PROFILE_URL_HOST}${buildPublicProfilePath(username)}`;
}

/* ------------------------------------------------------------------ draft */

export interface ProfileDraft {
  bio: string;
  pins: readonly string[];
  featuredGoalIds: readonly string[];
  audience: Record<ProfileSection, Audience>;
}

export const BIO_LIMIT = 140;
