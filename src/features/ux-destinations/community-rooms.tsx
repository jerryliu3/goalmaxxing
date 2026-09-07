"use client";

import { useState } from "react";
import { ConceptNote, DestinationChrome } from "@/features/ux-destinations/chrome";
import { getDestinationConcept } from "@/features/ux-destinations/model";
import {
  COMMUNITY_CHALLENGES,
  COMMUNITY_STANDINGS,
  DESTINATION_TODAY,
} from "@/features/ux-destinations/seed";

const concept = getDestinationConcept("rooms");
const MODES = [
  { id: "team", label: "Team" },
  { id: "challenges", label: "Challenges" },
  { id: "boards", label: "Boards" },
] as const;

export function CommunityRoomsConcept() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("team");
  const [nudged, setNudged] = useState(false);
  const [joined, setJoined] = useState<Record<string, boolean>>({
    distance: true,
    deep: false,
    closed: true,
  });
  const [invite, setInvite] = useState<"pending" | "accepted" | "declined">(
    "pending"
  );
  const [groupCode, setGroupCode] = useState("");
  const [groupJoined, setGroupJoined] = useState(false);
  const [publicOn, setPublicOn] = useState(true);
  const [profile, setProfile] = useState<string | null>(null);

  return (
    <DestinationChrome
      concept={concept}
      title="Community"
      modes={publicOn ? MODES : [{ id: "team", label: "Team" }]}
      mode={publicOn ? mode : "team"}
      onModeChange={(id) => setMode(id as typeof mode)}
      trailing={
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground">Live · 12s</span>
          <button
            type="button"
            className="font-semibold"
            aria-pressed={publicOn}
            onClick={() => {
              setPublicOn((value) => !value);
              setMode("team");
            }}
          >
            {publicOn ? "Public activity on" : "Team only"}
          </button>
        </div>
      }
    >
      <div className="pt-5">
        {!publicOn || mode === "team" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="rounded-[12px] border border-border p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Partner
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-4xl font-semibold tracking-tight">
                    {DESTINATION_TODAY.partner}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Yoga landed at 08:12 · Team XP 2,400
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfile(DESTINATION_TODAY.partner)}
                  className="grid size-14 place-items-center rounded-full bg-[#6b5dc6] text-sm font-bold text-white"
                >
                  M
                </button>
              </div>
              <div className="mt-6 grid grid-cols-7 gap-1" aria-label="Shared week">
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
              <div className="mt-6 flex flex-wrap gap-2">
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
                >
                  Leave team
                </button>
              </div>
            </section>
            <aside className="space-y-4">
              <section className="rounded-[12px] border border-border p-4">
                <h3 className="text-sm font-semibold">Incoming</h3>
                {invite === "pending" ? (
                  <div className="mt-3">
                    <p className="text-sm">Jordan wants to pair</p>
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
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {invite === "accepted" ? "Jordan accepted." : "Invite declined."}
                  </p>
                )}
              </section>
              <section className="rounded-[12px] border border-border p-4">
                <h3 className="text-sm font-semibold">Invite</h3>
                <label className="mt-3 block text-xs text-muted-foreground">
                  Username
                  <input
                    className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                    placeholder="username"
                  />
                </label>
                <button
                  type="button"
                  className="mt-3 min-h-9 w-full rounded-md border border-border text-xs font-semibold"
                >
                  Send invite
                </button>
                <p className="mt-3 text-xs text-muted-foreground">Outgoing to Sam</p>
              </section>
            </aside>
          </div>
        ) : null}

        {publicOn && mode === "challenges" ? (
          <ChallengeBoard joined={joined} onToggle={setJoined} />
        ) : null}

        {publicOn && mode === "boards" ? (
          <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <section className="rounded-[12px] border border-border p-4">
              <h2 className="text-sm font-semibold">Fall 2026</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Completions · Open season
              </p>
              <label className="mt-4 block text-xs text-muted-foreground">
                Join a group
                <input
                  value={groupCode}
                  onChange={(event) => setGroupCode(event.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  placeholder="Join code"
                />
              </label>
              <button
                type="button"
                className="mt-3 min-h-9 w-full rounded-md bg-foreground text-xs font-semibold text-background"
                onClick={() => setGroupJoined(true)}
              >
                {groupJoined ? "Joined group" : "Join group"}
              </button>
            </section>
            <section className="rounded-[12px] border border-border p-4">
              <h2 className="mb-3 font-display text-base font-semibold">Standings</h2>
              <ol>
                {COMMUNITY_STANDINGS.map((row) => (
                  <li key={row.rank}>
                    <button
                      type="button"
                      onClick={() => setProfile(row.name)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left text-sm ${
                        row.you ? "bg-muted" : ""
                      }`}
                    >
                      <span>
                        {row.rank}. {row.name}
                        {row.partner ? " · partner" : ""}
                        {row.you ? " · you" : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {row.xp.toLocaleString()} XP
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}

        {profile ? (
          <div className="mt-6 rounded-[12px] border border-border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{profile}</h2>
              <button
                type="button"
                className="text-sm font-semibold"
                onClick={() => setProfile(null)}
              >
                Close profile
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Public profile sheet: heatmap, XP, and achievements. Same as today.
            </p>
          </div>
        ) : null}
      </div>
      <ConceptNote concept={concept} />
    </DestinationChrome>
  );
}

function ChallengeBoard({
  joined,
  onToggle,
}: {
  joined: Record<string, boolean>;
  onToggle: (next: Record<string, boolean>) => void;
}) {
  const [activeId, setActiveId] = useState("distance");
  const active =
    COMMUNITY_CHALLENGES.find((item) => item.id === activeId) ??
    COMMUNITY_CHALLENGES[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <ul className="divide-y divide-border rounded-[12px] border border-border">
        {COMMUNITY_CHALLENGES.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActiveId(item.id)}
              aria-current={item.id === activeId ? "true" : undefined}
              className={`w-full px-4 py-3 text-left ${
                item.id === activeId ? "bg-muted" : ""
              }`}
            >
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="block text-xs text-muted-foreground">
                {item.metric} · {item.audience}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <section className="rounded-[12px] border border-border p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {active.audience}
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          {active.title}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{active.detail}</p>
        <p className="mt-4 text-sm">
          {active.metric} · {active.participants} participants
        </p>
        <button
          type="button"
          disabled={active.closed}
          onClick={() =>
            onToggle({ ...joined, [active.id]: !joined[active.id] })
          }
          className="mt-6 min-h-10 rounded-md bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40"
        >
          {active.closed
            ? "Closed"
            : joined[active.id]
              ? "Leave challenge"
              : "Join challenge"}
        </button>
      </section>
    </div>
  );
}
