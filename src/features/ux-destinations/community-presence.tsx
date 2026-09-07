"use client";

import { useState } from "react";
import { ConceptNote, DestinationChrome } from "@/features/ux-destinations/chrome";
import { getDestinationConcept } from "@/features/ux-destinations/model";
import {
  COMMUNITY_CHALLENGES,
  COMMUNITY_STANDINGS,
  DESTINATION_TODAY,
} from "@/features/ux-destinations/seed";

const concept = getDestinationConcept("presence");

export function CommunityPresenceConcept() {
  const [joined, setJoined] = useState(true);
  const [nudged, setNudged] = useState(false);
  const [rail, setRail] = useState<"standings" | "invite" | "group">("standings");
  const [invite, setInvite] = useState<"pending" | "accepted" | "declined">(
    "pending"
  );
  const challenge = COMMUNITY_CHALLENGES[0];

  return (
    <DestinationChrome
      concept={concept}
      title="Community"
      trailing={<p className="text-xs text-muted-foreground">Live · 12s</p>}
    >
      <div className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="overflow-hidden rounded-[16px] border border-border">
          <div className="flex items-start justify-between gap-4 bg-muted/40 px-5 py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                With {DESTINATION_TODAY.partner} · Rank 14
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Fall season
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                1,180 XP · partner is 3rd · no feed
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNudged(true)}
              className="min-h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-semibold text-background"
            >
              {nudged ? "Nudged" : "Nudge"}
            </button>
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-2">
            <div className="bg-background p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Current match
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold">
                {challenge.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{challenge.detail}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[60%] rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{challenge.metric}</p>
              <button
                type="button"
                onClick={() => setJoined((value) => !value)}
                className="mt-4 text-sm font-semibold"
              >
                {joined ? "Leave challenge" : "Join challenge"}
              </button>
            </div>
            <div className="bg-background p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Shared week
              </p>
              <div className="mt-4 flex gap-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
                  <div key={`${label}-${index}`} className="min-w-0 flex-1 text-center">
                    <p className="mb-1 text-[10px] text-muted-foreground">{label}</p>
                    <div
                      className={`h-16 rounded-md ${
                        index === 3 ? "bg-today" : index < 3 ? "bg-primary/35" : "bg-muted"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Duo week lives on Plan. Here it is presence, not a second planner.
              </p>
            </div>
          </div>
        </section>

        <aside>
          <div
            role="group"
            aria-label="Community rail"
            className="mb-3 inline-flex rounded-[10px] bg-muted p-0.5 text-xs font-medium"
          >
            {(
              [
                ["standings", "Boards"],
                ["invite", "Team"],
                ["group", "Group"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={rail === id}
                onClick={() => setRail(id)}
                className={
                  rail === id
                    ? "min-h-8 rounded-[8px] bg-background px-3"
                    : "min-h-8 rounded-[8px] px-3 text-muted-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>
          {rail === "standings" ? (
            <ol className="rounded-[12px] border border-border p-2">
              {COMMUNITY_STANDINGS.map((row) => (
                <li
                  key={row.rank}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                    row.you ? "bg-muted" : ""
                  }`}
                >
                  <span>
                    {row.rank} {row.name}
                  </span>
                  <span className="text-muted-foreground">{row.xp.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {rail === "invite" ? (
            <div className="rounded-[12px] border border-border p-4">
              <p className="text-sm font-semibold">Jordan wants to pair</p>
              {invite === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="min-h-9 rounded-md bg-foreground px-3 text-xs font-semibold text-background"
                    onClick={() => setInvite("accepted")}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="min-h-9 rounded-md border border-border px-3 text-xs font-semibold"
                    onClick={() => setInvite("declined")}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {invite === "accepted" ? "Accepted." : "Declined."}
                </p>
              )}
              <label className="mt-5 block text-xs text-muted-foreground">
                Invite by username
                <input
                  className="mt-1 h-9 w-full rounded-md border border-border px-2 text-sm"
                  placeholder="username"
                />
              </label>
              <p className="mt-3 text-xs text-muted-foreground">Outgoing to Sam</p>
            </div>
          ) : null}
          {rail === "group" ? (
            <div className="rounded-[12px] border border-border p-4">
              <p className="text-sm font-semibold">Join a group</p>
              <input
                className="mt-3 h-9 w-full rounded-md border border-border px-2 text-sm"
                placeholder="Join code"
              />
              <button
                type="button"
                className="mt-3 min-h-9 w-full rounded-md border border-border text-xs font-semibold"
              >
                Join
              </button>
            </div>
          ) : null}
        </aside>
      </div>
      <ConceptNote concept={concept} />
    </DestinationChrome>
  );
}
