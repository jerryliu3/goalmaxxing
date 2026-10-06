"use client";

import { Check, ChevronDown, Settings, UserRound } from "lucide-react";
import { DropdownMenu, Popover } from "radix-ui";
import type { CSSProperties, ReactNode } from "react";
import { formatNumber, XpMeter } from "@/components/xp/xp-progress-card";
import { XpWordmarkMeter } from "@/components/xp/xp-wordmark";
import { bandForTotalXp } from "@/lib/xp/altitude";
import { progressionForTotalXp } from "@/lib/xp/progression";
import type { DuoScope } from "@cadence/shared/social/duo";

export type IdentityConcept = "capsule" | "wordmark";

export const IDENTITY_CONCEPTS: { id: IdentityConcept; name: string }[] = [
  { id: "capsule", name: "Capsule" },
  { id: "wordmark", name: "Wordmark meter" },
];

export interface Person {
  name: string;
  avatarUrl: string | null;
}

export interface IdentitySample {
  viewer: Person;
  partner: Person | null;
  scope: DuoScope;
  setScope: (scope: DuoScope) => void;
  showPhotos: boolean;
  totalXp: number;
  rewardSequence: number;
  lastGain: number;
}

const SCOPE_OPTIONS: ReadonlyArray<{ value: DuoScope; label: string }> = [
  { value: "me", label: "Solo" },
  { value: "partner", label: "Partner" },
  { value: "both", label: "Duo" },
];

function facesFor(sample: IdentitySample, scope: DuoScope = sample.scope): Person[] {
  const { viewer, partner } = sample;
  return !partner || scope === "me" ? [viewer] : scope === "partner" ? [partner] : [viewer, partner];
}

function xpModel(totalXp: number) {
  const progression = progressionForTotalXp(totalXp);
  const span = (progression.nextLevelMinXp ?? totalXp) - progression.currentLevelMinXp;
  return {
    ...progression,
    percent: span > 0 ? Math.min(100, ((totalXp - progression.currentLevelMinXp) / span) * 100) : 100,
    toNext: progression.xpToNextLevel ?? 0,
    band: bandForTotalXp(totalXp).name,
    total: formatNumber(totalXp),
  };
}

/** Same overlap rule as the production account menu, with a free size for taller triggers. */
function Faces({ people, showPhotos, size }: { people: Person[]; showPhotos: boolean; size: number }) {
  return (
    <span className="ie-faces" aria-hidden="true">
      {people.map((person, index) => (
        <span
          key={`${person.name}-${index}`}
          className="ie-face"
          style={{ width: size, height: size, zIndex: people.length - index, marginLeft: index ? -size * 0.38 : 0 } as CSSProperties}
        >
          {showPhotos && person.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatarUrl} alt="" />
          ) : showPhotos ? (
            person.name.slice(0, 2).toUpperCase()
          ) : (
            <UserRound className="size-4" />
          )}
        </span>
      ))}
    </span>
  );
}

function Bar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <span className={`ie-bar ${className}`} role="progressbar" aria-label="XP toward next level" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${percent}%` }} />
    </span>
  );
}

function RewardFloat({ sample }: { sample: IdentitySample }) {
  if (!sample.rewardSequence) return null;
  return (
    <span key={sample.rewardSequence} className="ie-reward-float" aria-hidden="true">
      +{sample.lastGain} XP
    </span>
  );
}

function rewardAttr(sample: IdentitySample) {
  return sample.rewardSequence ? (sample.rewardSequence % 2 ? "odd" : "even") : undefined;
}

function XpSummary({ sample }: { sample: IdentitySample }) {
  const xp = xpModel(sample.totalXp);
  return (
    <div className="ie-menu-xp">
      <div>
        <strong>Level {xp.currentLevel}</strong>
        <span className="ie-overline">{xp.band}</span>
      </div>
      <Bar percent={xp.percent} />
      <p className="ie-mono ie-muted">{xp.total} XP · {formatNumber(xp.toNext)} to Level {xp.nextLevel}</p>
    </div>
  );
}

/**
 * The account menu with XP folded in. Each concept's identity is this trigger,
 * so the header keeps one control for "you": progress, whose plan, settings.
 */
function AccountMenu({ sample, className, label, children, withXp = true }: { sample: IdentitySample; className: string; label: string; children: ReactNode; withXp?: boolean }) {
  const selected = SCOPE_OPTIONS.find((option) => option.value === sample.scope)?.label ?? "Solo";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={className} aria-label={`${label}${sample.partner ? `, ${selected} view` : ""}`} data-reward={withXp ? rewardAttr(sample) : undefined}>
        {children}
        {withXp && <RewardFloat sample={sample} />}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="ie-menu">
          {withXp && <XpSummary sample={sample} />}
          {sample.partner && (
            <>
              <DropdownMenu.Label className="ie-menu-label">Viewing</DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={sample.scope} onValueChange={(value) => sample.setScope(value as DuoScope)}>
                {SCOPE_OPTIONS.map((option) => (
                  <DropdownMenu.RadioItem key={option.value} value={option.value} textValue={option.label} className="ie-menu-item">
                    <span className="ie-menu-faces"><Faces people={facesFor(sample, option.value)} showPhotos={sample.showPhotos} size={28} /></span>
                    <span className="flex-1 font-medium">{option.label}</span>
                    <DropdownMenu.ItemIndicator><Check className="size-4" /></DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
              <DropdownMenu.Separator className="ie-menu-separator" />
            </>
          )}
          <DropdownMenu.Item className="ie-menu-item" onSelect={(event) => event.preventDefault()}>
            <Settings className="size-4 text-muted-foreground" />
            Profile settings
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const chevron = <ChevronDown aria-hidden="true" className="ie-chevron" />;

/** The identity control. Wordmark meter keeps a plain (taller) account button; its XP is on the wordmark. */
export function Identity({ concept, sample }: { concept: IdentityConcept; sample: IdentitySample }) {
  const xp = xpModel(sample.totalXp);
  const people = facesFor(sample);
  if (concept === "capsule") {
    return (
      <AccountMenu sample={sample} label="Account and level" className="ie-id ie-id-capsule">
        <Faces people={people} showPhotos={sample.showPhotos} size={36} />
        <span className="ie-id-text">
          <span className="ie-id-row">
            <span className="ie-mono">Lv {xp.currentLevel}</span>
            <span className="ie-mono ie-muted ie-hide-narrow">{xp.total} XP</span>
          </span>
          <Bar percent={xp.percent} />
        </span>
        {chevron}
      </AccountMenu>
    );
  }
  return (
    <AccountMenu sample={sample} label="Account menu" className="ie-id ie-id-plain" withXp={false}>
      <Faces people={people} showPhotos={sample.showPhotos} size={36} />
      {chevron}
    </AccountMenu>
  );
}

/** Wordmark, plain or as the production `XpWordmarkMeter` (concept B), so +XP shows the real bulge. */
export function Wordmark({ sample, meter }: { sample: IdentitySample; meter: boolean }) {
  if (!meter) return <p className="ie-wordmark font-display">Goalmaxxing</p>;
  return <XpWordmarkMeter profile={{ totalXp: sample.totalXp, ...progressionForTotalXp(sample.totalXp) }} rewardSequence={sample.rewardSequence} />;
}

/** Main's header pieces as shipped: 36px XP pill with its own popover, and the face + chevron menu. */
export function CurrentXpPill({ sample }: { sample: IdentitySample }) {
  const profile = { totalXp: sample.totalXp, ...progressionForTotalXp(sample.totalXp) };
  return (
    <Popover.Root>
      <Popover.Trigger className="ie-current-pill" aria-label={`Level ${profile.currentLevel} progress`}>
        <XpMeter profile={profile} rewardSequence={sample.rewardSequence} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className="z-50 rounded-xl border border-border bg-popover px-3 py-2 font-mono text-xs shadow-[0_8px_24px_rgb(0_0_0/0.1)]">
          <p>{formatNumber(profile.totalXp)} XP</p>
          <p className="mt-0.5 text-muted-foreground">{formatNumber(profile.xpToNextLevel ?? 0)} XP to Level {profile.nextLevel}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function CurrentAccountMenu({ sample }: { sample: IdentitySample }) {
  return (
    <AccountMenu sample={sample} label="Account menu" className="ie-current-account" withXp={false}>
      <Faces people={facesFor(sample)} showPhotos={sample.showPhotos} size={32} />
      <ChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
    </AccountMenu>
  );
}
