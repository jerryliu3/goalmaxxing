"use client";

import { useState } from "react";
import {
  DESTINATION_TODAY,
  SHARED_GOALS,
} from "@/features/ux-destinations/seed";

export function CommunityTeam() {
  const [nudged, setNudged] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [invite, setInvite] = useState<"pending" | "accepted" | "declined">(
    "pending"
  );
  const [groupJoined, setGroupJoined] = useState(false);
  const [planGoal, setPlanGoal] = useState<string | null>(null);

  return (
    <section className="overflow-hidden rounded-[16px] border border-border">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-muted/40 px-5 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Team
          </p>
          <h2 className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {DESTINATION_TODAY.partner}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Yoga landed at 08:12 · Team XP 2,400
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setNudged(true)}
            className="min-h-10 rounded-md bg-foreground px-4 text-sm font-semibold text-background"
          >
            {nudged ? "Nudge sent" : "Nudge Maya"}
          </button>
          <button
            type="button"
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            Team settings
          </button>
        </div>
      </div>
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="bg-background p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Shared week
          </p>
          <div className="mt-3 grid grid-cols-7 gap-1" aria-label="Shared week">
            {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
              <div key={`${label}-${index}`} className="text-center">
                <p className="mb-1 text-[10px] text-muted-foreground">{label}</p>
                <div
                  className={`h-10 rounded-md ${
                    index === 3
                      ? "bg-today"
                      : index < 3
                        ? "bg-primary/30"
                        : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-background p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Shared goals
          </p>
          <ul className="mt-3 space-y-2">
            {SHARED_GOALS.map((goal) => (
              <li key={goal.title}>
                <button
                  type="button"
                  onClick={() => setPlanGoal(goal.title)}
                  className="flex w-full items-center justify-between gap-3 rounded-md text-left text-sm hover:bg-muted/60"
                >
                  <span>{goal.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {goal.you && goal.partner
                      ? "You + Maya"
                      : goal.you
                        ? "You"
                        : "Maya"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {planGoal ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Would open {planGoal} on Plan, in the duo board. Community lists
              who shares the goal; Plan is where you edit it.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Tap a goal to open it on Plan. No editor lives here.
            </p>
          )}
        </div>
      </div>
      {settingsOpen ? (
        <div className="border-t border-border p-5">
          <p className="text-sm font-semibold">Team settings</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Invites and join codes stay here. They are low-volume, so they are
            not on the first viewport.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[10px] border border-border p-3">
              <p className="text-xs font-semibold">Incoming</p>
              {invite === "pending" ? (
                <>
                  <p className="mt-2 text-sm">Jordan wants to pair</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="min-h-8 rounded-md bg-foreground px-3 text-xs font-semibold text-background"
                      onClick={() => setInvite("accepted")}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="min-h-8 rounded-md border border-border px-3 text-xs font-semibold"
                      onClick={() => setInvite("declined")}
                    >
                      Decline
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {invite === "accepted" ? "Jordan accepted." : "Declined."}
                </p>
              )}
            </div>
            <div className="rounded-[10px] border border-border p-3">
              <p className="text-xs font-semibold">Invite</p>
              <input
                className="mt-2 h-9 w-full rounded-md border border-border px-2 text-sm"
                placeholder="username"
              />
              <p className="mt-2 text-xs text-muted-foreground">Outgoing to Sam</p>
            </div>
            <div className="rounded-[10px] border border-border p-3">
              <p className="text-xs font-semibold">Join a group</p>
              <input
                className="mt-2 h-9 w-full rounded-md border border-border px-2 text-sm"
                placeholder="Join code"
              />
              <button
                type="button"
                className="mt-2 min-h-8 w-full rounded-md border border-border text-xs font-semibold"
                onClick={() => setGroupJoined(true)}
              >
                {groupJoined ? "Joined" : "Join"}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-muted-foreground"
          >
            Leave team
          </button>
        </div>
      ) : null}
    </section>
  );
}
