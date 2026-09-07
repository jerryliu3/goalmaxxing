export type DestinationFamily = "progress" | "community";

export type DestinationConceptSlug =
  | "atlas"
  | "pins"
  | "ribbon"
  | "club"
  | "ranks"
  | "stage"
  | "presence";

export interface DestinationConcept {
  slug: DestinationConceptSlug;
  family: DestinationFamily;
  number: string;
  name: string;
  thesis: string;
  navigation: string;
  whatItKeeps: string;
  whatItAdds: string;
  risk: string;
}

export const DESTINATION_CONCEPTS: readonly DestinationConcept[] = [
  {
    slug: "atlas",
    family: "progress",
    number: "P1",
    name: "Atlas",
    thesis:
      "Wide screens keep the old ledger: goals beside the map. Narrow screens put the heatmap first and a horizontal goal rail under it.",
    navigation:
      "Filter from the list or rail. Milestone runway sits between the map and readings when Thesis is in focus.",
    whatItKeeps:
      "Aggregate / edit / overlap, period, retro logging, streaks, rates, weekday / 30-day / category charts, team readings.",
    whatItAdds:
      "Responsive ledger plus a named runway that can hold a long milestone list.",
    risk: "Two presentations of the same list can feel like two products until they share one component.",
  },
  {
    slug: "pins",
    family: "progress",
    number: "P2",
    name: "Pins",
    thesis:
      "Atlas uses quiet dots. Pins writes the stop number on the cell so a ten-milestone goal is readable on the map.",
    navigation:
      "Numbered pins are always on Thesis days. Selecting a pin isolates Thesis and opens the runway.",
    whatItKeeps: "The ledger heatmap, selection, and the full reading set.",
    whatItAdds: "Visible milestone indices on the calendar itself.",
    risk: "Numbered cells collide on a dense month.",
  },
  {
    slug: "ribbon",
    family: "progress",
    number: "P3",
    name: "Ribbon",
    thesis:
      "A month is a stack of week ribbons, not a GitHub grid. Goals leave colored ticks; milestones are stations.",
    navigation: "Scan weeks top to bottom. Tap a station to open the milestone runway.",
    whatItKeeps: "Every Progress metric and milestone listing.",
    whatItAdds: "A less spreadsheet-like calendar that still logs unscheduled days.",
    risk: "Less compact than a heatmap; density is the trade.",
  },
  {
    slug: "club",
    family: "community",
    number: "C1",
    name: "Club",
    thesis:
      "Challenges are a card rail. Boards are almost full-width posters you still snap between — stage size, no thumbnail rail.",
    navigation:
      "Joined first. Unjoined tiles are join-only until you click in. Expand a tile for ranks. Join / leave stays at the foot.",
    whatItKeeps:
      "Pairing, nudge, leave, invites, join code, challenge join/leave, seasons, standings, freshness, privacy, profiles.",
    whatItAdds:
      "Challenge tiles stay compact enough to scan; each season gets a stage-sized board with the next one peeking.",
    risk: "A wide board carousel can feel like one season if the next poster does not peek clearly.",
  },
  {
    slug: "ranks",
    family: "community",
    number: "C2",
    name: "Ranks",
    thesis:
      "Same rails, but every joined tile already shows the ranked field. Unjoined tiles stay empty except Join.",
    navigation:
      "Scan joined races left to right. Click an unjoined tile only if you want a preview before joining.",
    whatItKeeps: "The Club team stage and the same join / leave actions.",
    whatItAdds: "Immediate social comparison on anything you already entered.",
    risk: "A row of full rank lists is noisier, especially once N grows.",
  },
  {
    slug: "stage",
    family: "community",
    number: "C3",
    name: "Stage",
    thesis:
      "One live board or challenge is the poster. Everything else is a thumbnail rail underneath.",
    navigation:
      "The featured tile holds ranks. The rail swaps which event is on stage. Better when seasons are few.",
    whatItKeeps: "The Club team stage and the same join / leave actions.",
    whatItAdds:
      "A single readable field of people without asking the eye to pan for the thing you care about.",
    risk: "Hidden events in the rail can feel less equal than a carousel of same-size tiles.",
  },
  {
    slug: "presence",
    family: "community",
    number: "C4",
    name: "Presence",
    thesis:
      "One composition: partner, current match, and season rank occupy the same stage.",
    navigation: "Focus the page; secondary actions sit in a rail instead of separate cards.",
    whatItKeeps: "Every Team, Challenge, Leaderboard, and group-join action.",
    whatItAdds: "A modern club surface: scoreboard, match, and people without a feed.",
    risk: "A dense first viewport can hide invite and join-code tasks.",
  },
] as const;

export function getDestinationConcept(
  slug: DestinationConceptSlug
): DestinationConcept {
  return DESTINATION_CONCEPTS.find((concept) => concept.slug === slug)!;
}
