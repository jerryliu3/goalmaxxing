"use client";

import { addDays, eachDayOfInterval, format, parseISO, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import { CONCEPT_PARTNER_NAME, CONCEPT_TODAY } from "@/features/ux-concepts/seed";
import { DestinationFrame } from "@/features/ux-concepts/destination-frame";
import { COMMUNITY_CONCEPTS, COMMUNITY_LOCK } from "@/features/ux-concepts/destination-catalog";
import {
  communityChallenges,
  communityLeaderboard,
  communityTeamGoals,
  conceptChallenge,
  partnerWeekItems,
  quietCircleEvents,
} from "@/features/ux-concepts/destination-seed";
import { PartnerPulse } from "@/features/ux-concepts/concept-primitives";
import { SharedWeekBoard } from "@/features/ux-concepts/shared-week-board";
import { useConceptSession } from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const duo = COMMUNITY_CONCEPTS[0];
const board = COMMUNITY_CONCEPTS[1];
const quiet = COMMUNITY_CONCEPTS[2];

type CommunityView = "team" | "challenges" | "leaderboards";

export function CommunityCompeteDestination() {
  const session = useConceptSession("community");
  const [view, setView] = useState<CommunityView>("team");
  const [nudged, setNudged] = useState(false);

  return (
    <DestinationFrame
      family="community"
      concept={COMMUNITY_LOCK}
      siblings={COMMUNITY_CONCEPTS}
      session={session}
      showSiblings={false}
      kicker="Together"
      heading="Community"
      subtitle="Team goals, challenges, and boards. No feed. Duo lives on Plan."
      extraHeader={
        <div className="mt-3">
          <CommunityViewToggle view={view} onChange={setView} />
        </div>
      }
      aside={
        <div>
          <p className="text-sm font-medium">Why this lock</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Challenges and leaderboards stay. Team stays here because team
            goals belong with the people they are for. Solo/Duo is a platform
            field — the shared week is on Plan, not a Community object.
          </p>
        </div>
      }
    >
      <div className="md:max-w-xl">
        {view === "team" ? (
          <div>
            <PartnerPulse />
            <button
              type="button"
              className="mt-4 min-h-8 rounded-full bg-violet-100 px-3 text-xs font-medium text-violet-950 touch-manipulation"
              onClick={() => setNudged(true)}
            >
              {nudged ? "Nudge sent" : "Nudge Maya"}
            </button>
            <h2 className="mt-6 text-sm font-semibold">Team goals</h2>
            <ul className="mt-2 divide-y border-y">
              {communityTeamGoals.map((goal) => (
                <li key={goal.id} className="py-3">
                  <p className="text-[15px] font-semibold tracking-tight">
                    {goal.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{goal.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {view === "challenges" ? (
          <ul className="divide-y border-y">
            {communityChallenges.map((item) => (
              <li key={item.id} className="py-3">
                <p className="text-[15px] font-semibold tracking-tight">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">{item.metric}</p>
                <p className="text-xs text-muted-foreground">{item.scope}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {view === "leaderboards" ? (
          <ol className="divide-y border-y">
            {communityLeaderboard.map((row) => (
              <li
                key={`${row.rank}-${row.name}`}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span>
                  <span className="font-medium">
                    {row.rank}. {row.name}
                  </span>
                  {"you" in row && row.you ? (
                    <span className="ml-2 text-xs text-muted-foreground">you</span>
                  ) : null}
                </span>
                <span className="text-muted-foreground">{row.score}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </DestinationFrame>
  );
}

function CommunityViewToggle({
  view,
  onChange,
}: {
  view: CommunityView;
  onChange: (view: CommunityView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Community views"
      className="inline-flex rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(["team", "challenges", "leaderboards"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={cn(
            "min-h-8 rounded-full px-3 capitalize touch-manipulation",
            view === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {value === "team"
            ? "Team"
            : value === "challenges"
              ? "Challenges"
              : "Leaderboards"}
        </button>
      ))}
    </div>
  );
}

export function CommunityDuoDestination() {
  const session = useConceptSession("community");
  const [nudged, setNudged] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <DestinationFrame
      family="community"
      concept={duo}
      siblings={COMMUNITY_CONCEPTS}
      session={session}
      kicker="Partner"
      heading={CONCEPT_PARTNER_NAME}
      subtitle="Completed Yoga today. Duo overlay — not a feed."
      extraHeader={
        <button
          type="button"
          className="mt-3 min-h-8 rounded-full bg-violet-100 px-3 text-xs font-medium text-violet-950 touch-manipulation"
          onClick={() => setNudged(true)}
        >
          {nudged ? "Nudge sent" : "Nudge Maya"}
        </button>
      }
      aside={
        <div>
          <p className="text-sm font-medium">September movement</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {conceptChallenge.metric}. {conceptChallenge.copy}
          </p>
        </div>
      }
    >
      <div className="md:max-w-xl">
        <PartnerPulse />
        <section className="mt-6">
          <h2 className="text-sm font-semibold">Her week</h2>
          <ul className="mt-2 divide-y border-y">
            {partnerWeekItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <span>
                  <span className="font-medium">{item.title}</span>
                  <span className="ml-2 text-muted-foreground">
                    {format(parseISO(item.date), "EEE")}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {item.completed ? "done" : "open"}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-primary touch-manipulation"
          onClick={() => setActivityOpen((open) => !open)}
        >
          {activityOpen ? "Hide activity" : "Activity"}
        </button>
        {activityOpen ? (
          <ul className="mt-3 divide-y border-y">
            {quietCircleEvents.map((item) => (
              <li key={item.id} className="py-3 text-sm">
                <span className="font-medium">{item.actor}</span>{" "}
                <span className="text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DestinationFrame>
  );
}

export function CommunityBoardDestination() {
  const session = useConceptSession("community");
  const days = useMemo(() => {
    const start = startOfWeek(parseISO(CONCEPT_TODAY), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, []);

  return (
    <DestinationFrame
      family="community"
      concept={board}
      siblings={COMMUNITY_CONCEPTS}
      session={session}
      kicker="This week together"
      heading="Shared board"
      subtitle="Two columns of work. Challenges stay a banner, not a chip row."
      aside={
        <div>
          <p className="text-sm font-medium">{conceptChallenge.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{conceptChallenge.metric}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Desktop is the native of this direction: you and Maya as panes.
          </p>
        </div>
      }
    >
      <SharedWeekBoard
        session={session}
        days={days}
        onOpenDay={session.setSelectedDate}
      />
    </DestinationFrame>
  );
}

export function CommunityQuietDestination() {
  const session = useConceptSession("community");

  return (
    <DestinationFrame
      family="community"
      concept={quiet}
      siblings={COMMUNITY_CONCEPTS}
      session={session}
      kicker="Circle"
      heading="Quiet circle"
      subtitle="People you opted into. No XP, no leaderboard tab."
      aside={
        <div>
          <p className="text-sm font-medium">{CONCEPT_PARTNER_NAME}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Partner first. Rankings would be a disclosed row, not an equal
            product.
          </p>
        </div>
      }
    >
      <div className="md:max-w-xl">
        <ul>
          {quietCircleEvents.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 border-b border-border/50 py-3 text-left touch-manipulation"
                onClick={() => {
                  if (item.id === "evt-deep") {
                    session.setSelectedItemId("deep-work");
                  }
                }}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.tone === "violet"
                      ? "bg-violet-500"
                      : item.tone === "emerald"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                  )}
                />
                <span>
                  <span className="block text-[15px] font-semibold tracking-tight">
                    {item.actor}
                  </span>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">
          Archive direction. The lock cuts the feed and keeps challenges on
          their own view.
        </p>
      </div>
    </DestinationFrame>
  );
}
