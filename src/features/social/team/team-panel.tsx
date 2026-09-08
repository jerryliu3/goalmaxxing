"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { PublicProfileTrigger } from "@/components/public-profile-trigger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { GroupJoinCard } from "@/features/social/group-join-card";
import {
  acceptSocialTeamInvite,
  createSocialTeamInvite,
  declineSocialTeamInvite,
  dissolveSocialTeam,
  fetchSocialTeamState,
  peekSocialTeamStateCache,
} from "@/features/social/data";
import { type TeamStateRow } from "@cadence/shared/social/team";
import { NudgeButton } from "@/features/social/team/nudge-button";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { createClient } from "@/lib/supabase/client";

interface TeamPanelProps {
  isActive?: boolean;
  refreshToken?: number;
}

interface SharedGoalRow {
  id: string;
  title: string;
}

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type TeamInviteControlsProps = {
  partnerUsername: string;
  message: string;
  pendingInvites: TeamStateRow[];
  stacked?: boolean;
  onPartnerUsernameChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onAccept: (teamId: string) => void;
  onDecline: (teamId: string) => void;
};

function TeamInviteControls({
  partnerUsername,
  message,
  pendingInvites,
  stacked = false,
  onPartnerUsernameChange,
  onMessageChange,
  onSend,
  onAccept,
  onDecline,
}: TeamInviteControlsProps) {
  const canSend = partnerUsername.trim().replace(/^@/, "").length >= 3;
  return (
    <div className="space-y-3">
      <div className={stacked ? "space-y-2" : "grid gap-2 md:grid-cols-3"}>
        <Input
          value={partnerUsername}
          onChange={(event) => onPartnerUsernameChange(event.target.value)}
          placeholder={stacked ? "username" : "Partner username"}
        />
        <Input
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Invite message (optional)"
        />
        <Button
          type="button"
          size={stacked ? "sm" : "default"}
          onClick={onSend}
          disabled={!canSend}
        >
          Send invite
        </Button>
      </div>
      <div className="space-y-2 text-sm">
        {stacked ? null : <p className="font-medium">Pending invites</p>}
        {pendingInvites.length === 0 ? (
          <p className="text-muted-foreground">No pending invites.</p>
        ) : (
          pendingInvites.map((invite) => (
            <div key={invite.teamId} className="rounded border p-3">
              <p className="font-medium">
                {invite.partnerDisplayName ?? invite.partnerUsername ?? invite.partnerId}
              </p>
              <p className="text-xs text-muted-foreground">
                {invite.isIncoming ? "Incoming" : "Outgoing"}
              </p>
              {invite.isIncoming ? (
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" onClick={() => onAccept(invite.teamId)}>
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onDecline(invite.teamId)}
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TeamPanel({ isActive = true, refreshToken = 0 }: TeamPanelProps) {
  const router = useAppRouter();
  const supabase = useMemo(() => createClient(), []);
  const cachedTeam = peekSocialTeamStateCache();
  const [rows, setRows] = useState<TeamStateRow[]>(cachedTeam?.items ?? []);
  const [partnerUsername, setPartnerUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sharedGoals, setSharedGoals] = useState<SharedGoalRow[]>([]);
  const todayWeekIndex = (new Date().getDay() + 6) % 7;

  const activeTeam = useMemo(
    () => rows.find((row) => row.status === "active") ?? null,
    [rows]
  );
  const pendingInvites = useMemo(
    () => rows.filter((row) => row.status === "pending"),
    [rows]
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await fetchSocialTeamState();
      setRows(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load team state.");
    }
  }, []);

  const loadSharedGoals = useCallback(
    async (teamId: string) => {
      const { data, error: goalsError } = await supabase
        .from("goals")
        .select("id, title")
        .eq("team_id", teamId)
        .eq("is_deleted", false)
        .order("title");
      if (goalsError) {
        setSharedGoals([]);
        return;
      }
      setSharedGoals((data ?? []) as SharedGoalRow[]);
    },
    [supabase]
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isActive, load, refreshToken]);

  useEffect(() => {
    if (!activeTeam) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadSharedGoals(activeTeam.teamId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [activeTeam, loadSharedGoals]);

  async function sendInvite() {
    setError(null);
    try {
      await createSocialTeamInvite({ partnerUsername, message });
      setPartnerUsername("");
      setMessage("");
      await load();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Could not send invite.");
    }
  }

  async function acceptInvite(teamId: string) {
    setError(null);
    try {
      await acceptSocialTeamInvite(teamId);
      await load();
      router.refresh();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Could not accept invite.");
    }
  }

  async function declineInvite(teamId: string) {
    setError(null);
    try {
      await declineSocialTeamInvite(teamId);
      await load();
      router.refresh();
    } catch (declineError) {
      setError(declineError instanceof Error ? declineError.message : "Could not decline invite.");
    }
  }

  async function dissolveActiveTeam() {
    const confirmed = window.confirm(
      "Leave team? You and your partner will no longer share duo progress until a new team is active."
    );
    if (!confirmed) {
      return;
    }
    setError(null);
    try {
      await dissolveSocialTeam();
      await load();
      router.refresh();
    } catch (dissolveError) {
      setError(dissolveError instanceof Error ? dissolveError.message : "Could not leave team.");
    }
  }

  const partnerName =
    activeTeam?.partnerDisplayName ??
    activeTeam?.partnerUsername ??
    "Partner";
  const inviteControls: TeamInviteControlsProps = {
    partnerUsername,
    message,
    pendingInvites,
    onPartnerUsernameChange: setPartnerUsername,
    onMessageChange: setMessage,
    onSend: () => void sendInvite(),
    onAccept: (teamId) => void acceptInvite(teamId),
    onDecline: (teamId) => void declineInvite(teamId),
  };

  return (
    <section className="overflow-hidden rounded-[16px] border border-border">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-muted/40 px-5 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Team
          </p>
          <h2 className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {activeTeam ? partnerName : "Find a partner"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTeam
              ? `Team XP ${activeTeam.teamXp ?? 0}`
              : "Invite a partner or accept an invite to start duo progress."}
          </p>
        </div>
        {activeTeam ? (
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <NudgeButton
              partnerId={activeTeam.partnerId}
              onSent={() => {
                void load();
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-expanded={settingsOpen}
              aria-label="Team settings"
              title="Team settings"
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <Settings />
            </Button>
          </div>
        ) : null}
      </div>

      {activeTeam ? (
        <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="bg-background p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Shared week
            </p>
            <Link
              href="/calendar?view=week"
              className="mt-3 block"
              aria-label="Open shared week on Plan"
            >
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label, index) => (
                  <div key={`${label}-${index}`} className="text-center">
                    <p className="mb-1 text-[10px] text-muted-foreground">{label}</p>
                    <div
                      className={`h-10 rounded-md ${
                        index === todayWeekIndex
                          ? "bg-today"
                          : index < todayWeekIndex
                            ? "bg-primary/30"
                            : "bg-muted"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </Link>
          </div>
          <div className="bg-background p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Shared goals
            </p>
            {activeTeam && sharedGoals.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Tap a goal to open it on Plan. No editor lives here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {sharedGoals.map((goal) => (
                  <li key={goal.id}>
                    <Link
                      href="/calendar?view=week"
                      className="flex w-full items-center justify-between gap-3 rounded-md text-left text-sm hover:bg-muted/60"
                    >
                      <span>{goal.title}</span>
                      <span className="text-xs text-muted-foreground">Open on Plan</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 bg-background p-5">
          <TeamInviteControls {...inviteControls} />
          <GroupJoinCard />
        </div>
      )}

      {activeTeam && settingsOpen ? (
        <div className="border-t border-border p-5">
          <p className="text-sm font-semibold">Team settings</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[10px] border border-border p-3">
              <p className="text-xs font-semibold">Invite</p>
              <div className="mt-2">
                <TeamInviteControls stacked {...inviteControls} />
              </div>
            </div>
            <div className="rounded-[10px] border border-border p-3">
              <GroupJoinCard />
            </div>
          </div>
          <PublicProfileTrigger
            subjectUserId={activeTeam.partnerId}
            buttonLabel={`Open ${partnerName} profile`}
            className="mt-4 flex items-center gap-3 rounded border border-border bg-muted/20 px-3 py-3"
          >
            <UserAvatar
              avatarUrl={activeTeam.partnerAvatarUrl}
              displayName={activeTeam.partnerDisplayName}
              username={activeTeam.partnerUsername}
              size="sm"
              alt="Partner avatar"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{partnerName}</p>
              <p className="truncate text-xs text-muted-foreground">Team partner</p>
            </div>
          </PublicProfileTrigger>
          <Button
            type="button"
            variant="ghost"
            className="mt-4 text-muted-foreground"
            onClick={() => void dissolveActiveTeam()}
          >
            Leave team
          </Button>
        </div>
      ) : null}

      {error ? <p className="px-5 pb-4 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
