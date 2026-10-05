export type AchievementConceptSlug =
  | "case"
  | "vault"
  | "gallery"
  | "records"
  | "rings"
  | "showcase";

export interface AchievementConcept {
  slug: AchievementConceptSlug;
  number: string;
  name: string;
  thesis: string;
  navigation: string;
  whatItKeeps: string;
  whatItAdds: string;
  risk: string;
  research: string;
}

export const ACHIEVEMENT_CONCEPTS: readonly AchievementConcept[] = [
  {
    slug: "showcase",
    number: "A6",
    name: "Showcase",
    thesis:
      "Leading hybrid: Case trophy structure + Vault premium dark metal and locked mounts + Records personal-bests band.",
    navigation:
      "Read personal records and the claimed bar, then pin an earned medal on the pedestal. Locked mounts stay dark — no spoilers for what’s next.",
    whatItKeeps:
      "Level awards, unlock dates, locked mounts, personal bests, claimed progress.",
    whatItAdds:
      "One proud composition that keeps trophies, Records, Vault craft, and honest locked mystery.",
    risk: "Dark glass plus a records band can feel tall on small phones if the pedestal is greedy.",
    research:
      "Review synthesis of A1 structure, A2 locked/claimed language, and A4 Duolingo Records split.",
  },
  {
    slug: "case",
    number: "A1",
    name: "Case",
    thesis:
      "A lit trophy case: newest unlock on a pedestal, XP medals on shelves, finished goals as plaques underneath.",
    navigation:
      "Scan shelves top to bottom. Tap a medal or plaque to pin it on the pedestal. Locked slots stay as empty mounts.",
    whatItKeeps:
      "Level awards, achieved goals, unlock dates, reward text, revoked honesty.",
    whatItAdds:
      "Dimensional medal art, warm case atmosphere, a hero object people can screenshot with pride.",
    risk: "Shelf density can feel decorative if empty mounts outnumber unlocked medals early on.",
    research: "Trophy-case display as personal status object; customizable featured award.",
  },
  {
    slug: "vault",
    number: "A2",
    name: "Vault",
    thesis:
      "A sealed vault of compartments. Locked cells stay dark and stamped shut; unlocked cells light with metal and ink.",
    navigation:
      "Grid scan. Tap a cell to open the inspection drawer. Collection fill reads as how much of the vault has been claimed.",
    whatItKeeps: "The same award + goal inventory and locked/unlocked truth.",
    whatItAdds:
      "Preciousness — unlocking feels like opening a door, not appending a list row.",
    risk: "Too dark or gamey if the seal language drifts into loot-crate tropes.",
    research: "Completion-as-capacity; sealed vs claimed contrast instead of a flat list.",
  },
  {
    slug: "gallery",
    number: "A3",
    name: "Gallery",
    thesis:
      "An awards library: level unlocks as framed posters you snap between; goals as hanging certificates in a second rail.",
    navigation:
      "Horizontal snap for medals, then certificates. The active frame is stage-sized with the next piece peeking.",
    whatItKeeps: "Full award metadata and goal finishes without burying either list.",
    whatItAdds:
      "Museum pacing — each award gets wall space, color field, and a readable caption.",
    risk: "Snap rails need a clear peek; without it the gallery collapses to one poster.",
    research: "Letterboxd / Polarsteps — hung frames and chapters you can hold.",
  },
  {
    slug: "records",
    number: "A4",
    name: "Records",
    thesis:
      "Duolingo’s 2023 split, Gazetteer-skinned: Personal Records (bests you can earn early) above Awards (long-horizon medals and goal seals).",
    navigation:
      "Read the records band first. Scroll into the Awards grid for level mounts and finished goals. Tap an award to expand its caption.",
    whatItKeeps: "Every XP award and achieved goal, plus honest locked mounts.",
    whatItAdds:
      "A first-session pride surface (records) that does not dilute rare awards.",
    risk: "Two zones can feel like two products if the typography hierarchy is weak.",
    research: "Duolingo Personal Records vs Awards; day-one unlock retention finding.",
  },
  {
    slug: "rings",
    number: "A5",
    name: "Rings",
    thesis:
      "Apple Fitness glance: three completion rings (awards, goals, level) own the first viewport; the inventory waits below.",
    navigation:
      "Close the rings with your eye. Tap a ring to filter the shelf. Detail and dates live in the filtered inventory.",
    whatItKeeps: "The full collection underneath the glance.",
    whatItAdds:
      "Progress-as-completion before any badge chrome — pride without a dump.",
    risk: "Rings without a clear unit legend become decorative circles.",
    research: "Apple Fitness rings — completion first, detail second; no badge inflation.",
  },
] as const;

export function getAchievementConcept(
  slug: AchievementConceptSlug
): AchievementConcept {
  return ACHIEVEMENT_CONCEPTS.find((concept) => concept.slug === slug)!;
}
