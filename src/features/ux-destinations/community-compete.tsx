"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CHALLENGE_PEOPLE,
  COMMUNITY_CHALLENGES,
  COMMUNITY_SEASONS,
} from "@/features/ux-destinations/seed";

export type CompeteTreatment = "peek" | "open" | "stage";

type RailPerson = {
  rank: number;
  name: string;
  you: boolean;
  partner: boolean;
  label: string;
  percent: number;
};

type EventTile = {
  key: string;
  title: string;
  kicker: string;
  metric: string;
  detail: string;
  joined: boolean;
  closed: boolean;
  people: RailPerson[];
  joinLabel: string;
  leaveLabel: string;
};

export function CommunityCompete({ treatment }: { treatment: CompeteTreatment }) {
  const [joinedEvents, setJoinedEvents] = useState<Record<string, boolean>>(() => {
    const next: Record<string, boolean> = {};
    for (const item of COMMUNITY_CHALLENGES) next[`challenge:${item.id}`] = item.joined;
    for (const item of COMMUNITY_SEASONS) next[`season:${item.id}`] = item.joined;
    return next;
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [featuredChallenge, setFeaturedChallenge] = useState(
    `challenge:${COMMUNITY_CHALLENGES.find((item) => item.joined)?.id ?? COMMUNITY_CHALLENGES[0].id}`
  );
  const [featuredSeason, setFeaturedSeason] = useState(
    `season:${COMMUNITY_SEASONS.find((item) => item.joined && !item.closed)?.id ?? COMMUNITY_SEASONS[0].id}`
  );

  const challenges = useMemo(
    () =>
      sortJoinedFirst(
        COMMUNITY_CHALLENGES.map((item) => {
          const key = `challenge:${item.id}`;
          const joined = joinedEvents[key] ?? item.joined;
          return {
            key,
            title: item.title,
            kicker: `${item.participants} people · ${item.audience}`,
            metric: joined ? item.metric : "Join to track",
            detail: item.detail,
            joined,
            closed: item.closed,
            people: withMembership(
              (CHALLENGE_PEOPLE[item.id] ?? []).map((row) => ({
                rank: row.rank,
                name: row.name,
                you: row.you,
                partner: row.partner,
                label: `${row.progress}%`,
                percent: row.progress,
              })),
              joined
            ),
            joinLabel: "Join challenge",
            leaveLabel: "Leave challenge",
          } satisfies EventTile;
        }),
        joinedEvents
      ),
    [joinedEvents]
  );

  const seasons = useMemo(
    () =>
      sortJoinedFirst(
        COMMUNITY_SEASONS.map((item) => {
          const key = `season:${item.id}`;
          const joined = joinedEvents[key] ?? item.joined;
          const leader = item.people[0]?.xp ?? 1;
          return {
            key,
            title: item.title,
            kicker: item.closed ? "Closed season" : "Live season",
            metric: item.metric,
            detail: item.detail,
            joined,
            closed: item.closed,
            people: withMembership(
              item.people.map((row) => ({
                rank: row.rank,
                name: row.name,
                you: row.you,
                partner: Boolean(row.partner),
                label: `${row.xp.toLocaleString()} XP`,
                percent: Math.round((row.xp / leader) * 100),
              })),
              joined
            ),
            joinLabel: "Join board",
            leaveLabel: "Leave board",
          } satisfies EventTile;
        }),
        joinedEvents
      ),
    [joinedEvents]
  );

  function toggleJoin(key: string) {
    setJoinedEvents((current) => ({ ...current, [key]: !current[key] }));
    setExpanded(key);
  }

  function toggleExpand(key: string) {
    setExpanded((current) => (current === key ? null : key));
  }

  return (
    <div className="space-y-8">
      <CompeteSection
        title="Challenges"
        span="card"
        treatment={treatment}
        tiles={challenges}
        featuredKey={featuredChallenge}
        expanded={expanded}
        onFeature={setFeaturedChallenge}
        onExpand={toggleExpand}
        onJoin={toggleJoin}
      />
      <CompeteSection
        title="Boards"
        span="wide"
        treatment={treatment}
        tiles={seasons}
        featuredKey={featuredSeason}
        expanded={expanded}
        onFeature={setFeaturedSeason}
        onExpand={toggleExpand}
        onJoin={toggleJoin}
      />
    </div>
  );
}

function CompeteSection({
  title,
  span,
  treatment,
  tiles,
  featuredKey,
  expanded,
  onFeature,
  onExpand,
  onJoin,
}: {
  title: string;
  span: "card" | "wide";
  treatment: CompeteTreatment;
  tiles: EventTile[];
  featuredKey: string;
  expanded: string | null;
  onFeature: (key: string) => void;
  onExpand: (key: string) => void;
  onJoin: (key: string) => void;
}) {
  const featured = tiles.find((tile) => tile.key === featuredKey) ?? tiles[0];

  if (treatment === "stage") {
    return (
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">One poster, a rail of the rest</p>
        </div>
        {featured ? (
          <CompeteTile
            tile={featured}
            span="wide"
            density={
              featured.joined || expanded === featured.key ? "ranks" : "join-only"
            }
            expanded={expanded === featured.key || featured.joined}
            featured
            onExpand={() => onExpand(featured.key)}
            onJoin={() => onJoin(featured.key)}
          />
        ) : null}
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              type="button"
              aria-pressed={tile.key === featured.key}
              onClick={() => onFeature(tile.key)}
              className={`min-h-16 shrink-0 rounded-[12px] border px-4 py-3 text-left ${
                tile.key === featured.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background"
              }`}
            >
              <span className="block text-sm font-semibold">{tile.title}</span>
              <span
                className={`block text-xs ${
                  tile.key === featured.key ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {tile.joined ? tile.metric : "Not joined"}
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <SnapRail
        label={title}
        hint={
          span === "wide"
            ? "Stage-size posters · snap to the next season"
            : treatment === "peek"
              ? "Your score first · ranks on click"
              : "Joined tiles show the field"
        }
      >
        {tiles.map((tile) => {
          const isExpanded = expanded === tile.key;
          const density =
            treatment === "open"
              ? tile.joined || isExpanded
                ? "ranks"
                : "join-only"
              : !tile.joined && !isExpanded
                ? "join-only"
                : isExpanded
                  ? "ranks"
                  : "peek";
          return (
            <CompeteTile
              key={tile.key}
              tile={tile}
              span={span}
              density={density}
              expanded={isExpanded}
              onExpand={() => onExpand(tile.key)}
              onJoin={() => onJoin(tile.key)}
            />
          );
        })}
      </SnapRail>
    </section>
  );
}

function SnapRail({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    const node = scroller.current;
    if (!node) return;
    const child = node.querySelector("article");
    const amount = child ? child.getBoundingClientRect().width + 16 : 320;
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {label}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md border border-border"
            aria-label={`Scroll ${label} left`}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md border border-border"
            aria-label={`Scroll ${label} right`}
            onClick={() => scroll(1)}
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
      >
        {children}
      </div>
    </div>
  );
}

function CompeteTile({
  tile,
  density,
  expanded,
  featured = false,
  span = "card",
  onExpand,
  onJoin,
}: {
  tile: EventTile;
  density: "join-only" | "peek" | "ranks";
  expanded: boolean;
  featured?: boolean;
  span?: "card" | "wide";
  onExpand: () => void;
  onJoin: () => void;
}) {
  const peekPeople = tile.people.filter((row) => row.you || row.partner);
  const rows = density === "peek" ? peekPeople : tile.people;
  const wide = featured || span === "wide";

  return (
    <article
      className={`flex min-h-[22.5rem] snap-start flex-col rounded-[16px] border border-border p-5 ${
        featured
          ? "w-full"
          : span === "wide"
            ? "flex-[0_0_calc(100%-2.75rem)]"
            : "w-[28rem] max-w-[calc(100%-1.5rem)] shrink-0"
      }`}
    >
      <button type="button" className="text-left" onClick={onExpand}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {tile.kicker}
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {tile.title}
        </h3>
        <p className="mt-1 font-display text-lg tracking-tight">{tile.metric}</p>
        <p className="mt-1 text-sm text-muted-foreground">{tile.detail}</p>
      </button>

      {density === "join-only" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Ranked people stay hidden until you join or open this tile.
        </p>
      ) : (
        <ol className="mt-5 space-y-2">
          {rows.map((row) => (
            <li
              key={`${tile.key}-${row.name}`}
              className={row.you ? "rounded-md bg-muted px-2 py-2" : "px-2 py-1"}
            >
              <div className="flex items-center justify-between text-sm">
                <span>
                  {density === "ranks" ? `${row.rank}. ` : null}
                  {row.name}
                  {row.you ? " · you" : row.partner ? " · team" : ""}
                </span>
                <span className="text-muted-foreground">{row.label}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${row.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      {density === "peek" && !expanded ? (
        <p className="mt-3 text-xs text-muted-foreground">Tap to open the ranked field</p>
      ) : null}

      <button
        type="button"
        disabled={tile.closed}
        onClick={onJoin}
        className={`mt-auto min-h-10 rounded-md bg-foreground text-sm font-semibold text-background disabled:opacity-40 ${
          wide ? "w-full sm:max-w-xs" : "w-full"
        }`}
      >
        {tile.closed
          ? "Closed"
          : tile.joined
            ? tile.leaveLabel
            : tile.joinLabel}
      </button>
    </article>
  );
}

function sortJoinedFirst(tiles: EventTile[], joinedEvents: Record<string, boolean>) {
  return [...tiles].sort((a, b) => {
    const aJoined = joinedEvents[a.key] ? 0 : 1;
    const bJoined = joinedEvents[b.key] ? 0 : 1;
    return aJoined - bJoined;
  });
}

function withMembership(people: RailPerson[], joined: boolean): RailPerson[] {
  const withoutYou = people.filter((row) => !row.you);
  if (!joined) return withoutYou;
  if (people.some((row) => row.you)) return [...people];
  const usesXp = people.some((row) => row.label.includes("XP"));
  return [
    ...withoutYou,
    {
      rank: withoutYou.length + 1,
      name: "You",
      you: true,
      partner: false,
      label: usesXp ? "0 XP" : "0%",
      percent: 0,
    },
  ];
}
