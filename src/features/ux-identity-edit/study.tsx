"use client";

import Link from "next/link";
import { ArrowLeft, Monitor, RotateCcw, Smartphone } from "lucide-react";
import { type ReactNode, useState } from "react";
import { minTotalXpForLevel, progressionForTotalXp } from "@/lib/xp/progression";
import { AnnotatedCard } from "./card-annotated";
import { BACK_STYLES, type BackStyle } from "./card-back";
import { DirectCard } from "./card-direct";
import {
  CurrentAccountMenu,
  CurrentXpPill,
  IDENTITY_CONCEPTS,
  Identity,
  Wordmark,
  type IdentityConcept,
  type IdentitySample,
} from "./header-concepts";
import {
  AskField,
  COACH_OPTIONS,
  CoachPill,
  Invitation,
  JoinedCoach,
  LabTabs,
  NestMark,
  useCoachState,
  type CoachOption,
} from "./coach-concepts";
import { CoachMark } from "@/features/coach/coach-mark";
import coachStyles from "@/features/coach/coach.module.css";
import type { DuoScope } from "@cadence/shared/social/duo";
import { EDIT_SAMPLES, useEditSessions } from "./use-edit-session";
import "./study.css";

type Section = "header" | "edit";
const AVATAR_URL = "https://randomuser.me/api/portraits/men/32.jpg";
const PARTNER_AVATAR_URL = "https://randomuser.me/api/portraits/women/44.jpg";
const START_XP = 2460;

export function IdentityEditStudy() {
  const [section, setSection] = useState<Section>("header");
  const [phone, setPhone] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="ie-study">
      <header className="ie-lab-header">
        <Link href="/ux" className="ie-lab-back"><ArrowLeft size={15} />UX labs</Link>
        <span className="ie-lab-title">Header identity & goal editing</span>
        <nav aria-label="Studies">
          <button type="button" aria-current={section === "header" ? "page" : undefined} onClick={() => setSection("header")}>1 · Header identity</button>
          <button type="button" aria-current={section === "edit" ? "page" : undefined} onClick={() => setSection("edit")}>2 · Edit goal</button>
        </nav>
        <div className="ie-lab-device" role="group" aria-label="Preview size">
          <button type="button" className="ie-icon-button" aria-label="Desktop preview" aria-pressed={!phone} onClick={() => setPhone(false)}><Monitor size={17} /></button>
          <button type="button" className="ie-icon-button" aria-label="Phone preview" aria-pressed={phone} onClick={() => setPhone(true)}><Smartphone size={17} /></button>
        </div>
        <button type="button" className="ie-icon-button" aria-label="Reset sample" title="Reset sample" onClick={() => setResetKey((key) => key + 1)}><RotateCcw size={16} /></button>
      </header>
      {section === "header" ? <HeaderStudy key={resetKey} phone={phone} /> : <EditStudy key={resetKey} phone={phone} />}
    </div>
  );
}

/* ───────────────────────── Header study ───────────────────────── */

type FrameWidth = "wide" | "tablet";
type Frame = FrameWidth | "phone";
const FRAME_PX: Record<Frame, number> = { wide: 1280, tablet: 820, phone: 390 };

function HeaderStudy({ phone }: { phone: boolean }) {
  const [width, setWidth] = useState<FrameWidth>("wide");
  const [paired, setPaired] = useState(true);
  const [photo, setPhoto] = useState(true);
  const [ready, setReady] = useState(false);
  const [scope, setScope] = useState<DuoScope>("me");
  const [xp, setXp] = useState({ totalXp: START_XP, rewardSequence: 0, lastGain: 0 });
  const gain = (amount: number) => setXp((current) => ({ totalXp: current.totalXp + amount, rewardSequence: current.rewardSequence + 1, lastGain: amount }));
  const sample: IdentitySample = {
    viewer: { name: "Alex", avatarUrl: AVATAR_URL },
    partner: paired ? { name: "Jordan", avatarUrl: PARTNER_AVATAR_URL } : null,
    scope: paired ? scope : "me",
    setScope,
    showPhotos: photo,
    ...xp,
  };
  const nextLevelXp = progressionForTotalXp(xp.totalXp).nextLevelMinXp ?? xp.totalXp;
  const frame: Frame = phone ? "phone" : width;

  return (
    <>
      <div className="ie-lab-controls">
        {!phone && <Segmented label="Width" value={width} onChange={setWidth} options={[["wide", "Wide · 1280"], ["tablet", "Tablet · 820"]]} />}
        <Segmented label="Partner" value={paired ? "paired" : "solo"} onChange={(value) => setPaired(value === "paired")} options={[["paired", "Paired"], ["solo", "No partner"]]} />
        <Segmented label="Photos" value={photo ? "on" : "off"} onChange={(value) => setPhoto(value === "on")} options={[["on", "On"], ["off", "Off"]]} />
        <Segmented label="Check-in" value={ready ? "ready" : "none"} onChange={(value) => setReady(value === "ready")} options={[["none", "None"], ["ready", "Ready"]]} />
        <button type="button" className="ie-button" onClick={() => gain(40)}>+40 XP</button>
        <button type="button" className="ie-button" onClick={() => gain(nextLevelXp - xp.totalXp + 15)}>Level up</button>
        <span>Open an identity for its menu · click a coach entry to toggle the pane</span>
      </div>
      <div className="ie-header-list" data-ready={ready}>
        <section className="ie-header-case" aria-label="Current (main)">
          <div className="ie-case-caption">
            <strong>Current (main)</strong>
            <span>36px XP pill with its own popover, centred tabs, Coach pill and the face + chevron account menu. No wordmark.</span>
          </div>
          <FrameBox frame={frame}><CurrentFrame sample={sample} ready={ready} phone={phone} /></FrameBox>
        </section>
        {COACH_OPTIONS.map((option) => (
          <section key={option.id} className="ie-header-case" aria-label={option.name}>
            <div className="ie-case-caption">
              <strong>{option.name}</strong>
              <span>{option.pitch}</span>
            </div>
            {IDENTITY_CONCEPTS.map((identity) => (
              <div key={identity.id} className="ie-pair">
                <span className="ie-pair-label">{identity.name}</span>
                <FrameBox frame={frame}>
                  <HeaderFrame key={`${ready}`} identity={identity.id} option={option.id} sample={sample} ready={ready} phone={phone} />
                </FrameBox>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}

function FrameBox({ frame, children }: { frame: Frame; children: ReactNode }) {
  return (
    <div className="ie-frame-scroll">
      <div className="ie-shell bg-page" data-frame={frame} style={{ width: FRAME_PX[frame] }}>{children}</div>
    </div>
  );
}

/** Mirrors main's header zones: status · destinations · coach + account, one row when wide. */
function HeaderFrame({ identity, option, sample, ready, phone }: { identity: IdentityConcept; option: CoachOption; sample: IdentitySample; ready: boolean; phone: boolean }) {
  const coach = useCoachState(ready);
  const you = <Identity concept={identity} sample={sample} />;
  const tabCoach = option === "tab" ? coach : undefined;
  return (
    <>
      <div className="ie-app-header" data-identity={identity} data-option={option}>
        <div className="ie-zone-left">
          {option === "nest" && <NestMark coach={coach} />}
          <Wordmark sample={sample} meter={identity === "wordmark"} />
        </div>
        <div className="ie-zone-tabs"><LabTabs coach={tabCoach} /></div>
        <div className="ie-zone-right">
          {option === "pill" && <CoachPill coach={coach} />}
          {option === "ask" && <AskField coach={coach} compact={identity === "capsule"} />}
          {option === "joined" ? <JoinedCoach coach={coach} identity={you} /> : you}
        </div>
      </div>
      {phone && <LabTabs mobile coach={tabCoach} />}
    </>
  );
}

function CurrentFrame({ sample, ready, phone }: { sample: IdentitySample; ready: boolean; phone: boolean }) {
  const coach = useCoachState(ready);
  return (
    <>
      <div className="ie-app-header">
        <div className="ie-zone-left"><CurrentXpPill sample={sample} /></div>
        <div className="ie-zone-tabs"><LabTabs /></div>
        <div className="ie-zone-right">
          <span className="ie-anchor">
            <button type="button" className={coachStyles.headerButton} aria-expanded={coach.open} onClick={coach.toggle}>
              <CoachMark small />
              <span className="ie-coach-label">Coach</span>
              {coach.ready && <i className={coachStyles.statusDot} aria-label="Check-in ready" />}
            </button>
            <Invitation coach={coach} />
          </span>
          <CurrentAccountMenu sample={sample} />
        </div>
      </div>
      {phone && <LabTabs mobile />}
    </>
  );
}

/* ───────────────────────── Edit study ───────────────────────── */

type EditConcept = "editor" | "direct" | "annotated";

const EDIT_CONCEPTS: { id: EditConcept; name: string; pitch: string }[] = [
  { id: "editor", name: "Card editor", pitch: "The pick: the annotated card on desktop, the direct card on phone (switch with the device toggle). Both turn over for more." },
  { id: "direct", name: "F · Direct", pitch: "The card is the control: type over the title, nudge the number, tap the category, effort bars, privacy line, date or time." },
  { id: "annotated", name: "G · Annotated", pitch: "Callouts sit level with the fact they describe, joined by leader lines. Click a callout or the fact on the card to edit it." },
];

function EditStudy({ phone }: { phone: boolean }) {
  const [concept, setConcept] = useState<EditConcept>("editor");
  const [backStyle, setBackStyle] = useState<BackStyle>("list");
  const { session, goalId, setGoalId } = useEditSessions();
  const meta = EDIT_CONCEPTS.find((item) => item.id === concept)!;
  const direct = concept === "direct" || (concept === "editor" && phone);
  return (
    <>
      <div className="ie-lab-controls">
        <Segmented label="Concept" value={concept} onChange={setConcept} options={EDIT_CONCEPTS.map((item) => [item.id, item.name])} />
        <Segmented label="Back" value={backStyle} onChange={setBackStyle} options={BACK_STYLES.map((item) => [item.id, item.name])} />
        <label className="ie-lab-select">
          Goal
          <select value={goalId} onChange={(event) => setGoalId(event.target.value)}>
            {EDIT_SAMPLES.map(({ goal, note }) => <option key={goal.id} value={goal.id}>{goal.title} · {note}</option>)}
          </select>
        </label>
        <span>Edits are shared across concepts · nothing is saved</span>
      </div>
      <p className="ie-pitch">{meta.pitch}</p>
      <div className="ie-edit-stage" data-phone={phone} data-concept={direct ? "direct" : "annotated"}>
        <div className="ie-dialog" role="dialog" aria-label="Edit goal">
          {direct ? <DirectCard session={session} backStyle={backStyle} touch={phone} /> : <AnnotatedCard session={session} backStyle={backStyle} />}
        </div>
      </div>
    </>
  );
}

function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: [T, string][] }) {
  return (
    <div className="ie-segmented" role="group" aria-label={label}>
      <span>{label}</span>
      {options.map(([option, text]) => (
        <button type="button" key={option} aria-pressed={value === option} onClick={() => onChange(option)}>{text}</button>
      ))}
    </div>
  );
}
