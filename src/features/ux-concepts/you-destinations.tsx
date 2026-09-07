"use client";

import { useState } from "react";
import { CONCEPT_PARTNER_NAME, CONCEPT_VIEWER_NAME, CONCEPT_WEEK_DONE, CONCEPT_WEEK_PLANNED } from "@/features/ux-concepts/seed";
import { DestinationFrame } from "@/features/ux-concepts/destination-frame";
import { YOU_CONCEPTS, YOU_LOCK } from "@/features/ux-concepts/destination-catalog";
import { youControlGroups } from "@/features/ux-concepts/destination-seed";
import { useConceptSession } from "@/features/ux-concepts/use-concept-session";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const list = YOU_CONCEPTS[0];
const person = YOU_CONCEPTS[1];
const controls = YOU_CONCEPTS[2];

type ControlRow = {
  id: string;
  label: string;
  value: string;
};

const allControlRows: readonly ControlRow[] = youControlGroups.flatMap((group) =>
  group.rows.map((row): ControlRow => row)
);

export function YouAccountDestination() {
  const session = useConceptSession("you");
  const [openRow, setOpenRow] = useState<ControlRow | null>(null);
  const profileRow = youControlGroups[2].rows[0];

  return (
    <>
      <DestinationFrame
        family="you"
        concept={YOU_LOCK}
        siblings={YOU_CONCEPTS}
        session={session}
        showSiblings={false}
        kicker="Account"
        heading={CONCEPT_VIEWER_NAME}
        subtitle="alex@goalmaxxing.test"
        extraHeader={
          <button
            type="button"
            className="mt-3 text-sm font-medium text-primary touch-manipulation"
            onClick={() => setOpenRow(profileRow)}
          >
            Edit profile
          </button>
        }
        aside={
          <div>
            <p className="text-sm font-medium">Why this lock</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Identity stays visible at the top, like the Settings List hero.
              Grouped Plan / Connected / Account controls sit underneath.
            </p>
          </div>
        }
      >
        <div className="md:max-w-xl">
          {youControlGroups.map((group) => (
            <section key={group.id} className="mt-6 first:mt-0">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h2>
              <ul className="mt-1">
                {group.rows.map((row) => (
                  <SettingsRow key={row.id} row={row} onOpen={setOpenRow} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DestinationFrame>
      <SettingsSheet row={openRow} onClose={() => setOpenRow(null)} />
    </>
  );
}

export function YouListDestination() {
  const session = useConceptSession("you");
  const [openRow, setOpenRow] = useState<ControlRow | null>(null);

  return (
    <>
      <DestinationFrame
        family="you"
        concept={list}
        siblings={YOU_CONCEPTS}
        session={session}
        kicker="Account"
        heading={CONCEPT_VIEWER_NAME}
        subtitle="Identity, then a list. Sheets for the rest."
        aside={
          <div>
            <p className="text-sm font-medium">Closest to live Profile</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Live Settings is an account card plus nested cards. This is the
              same IA with rows instead of a second application.
            </p>
          </div>
        }
      >
        <div className="md:max-w-xl">
          <p className="px-1 text-sm text-muted-foreground">
            {CONCEPT_VIEWER_NAME.toLowerCase()} · alex@goalmaxxing.test
          </p>
          <ul className="mt-4">
            {allControlRows.map((row) => (
              <SettingsRow key={row.id} row={row} onOpen={setOpenRow} />
            ))}
          </ul>
        </div>
      </DestinationFrame>
      <SettingsSheet row={openRow} onClose={() => setOpenRow(null)} />
    </>
  );
}

export function YouPersonDestination() {
  const session = useConceptSession("you");
  const [openRow, setOpenRow] = useState<ControlRow | null>(null);

  return (
    <>
      <DestinationFrame
        family="you"
        concept={person}
        siblings={YOU_CONCEPTS}
        session={session}
        kicker="You"
        heading={CONCEPT_VIEWER_NAME}
        subtitle={`Partner ${CONCEPT_PARTNER_NAME} · ${CONCEPT_WEEK_DONE} of ${CONCEPT_WEEK_PLANNED} this week.`}
        aside={
          <div>
            <p className="text-sm font-medium">{CONCEPT_PARTNER_NAME}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Person direction puts Duo on You. Community can stay quieter —
              or stop being a tab.
            </p>
          </div>
        }
      >
        <div className="md:max-w-xl">
          <div className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-950">
            <p className="font-medium">{CONCEPT_PARTNER_NAME} completed Yoga</p>
            <p className="text-xs text-violet-900/70">
              Context on You, not a feed on Community.
            </p>
          </div>
          <ul className="mt-4">
            {allControlRows.map((row) => (
              <SettingsRow key={row.id} row={row} onOpen={setOpenRow} />
            ))}
          </ul>
        </div>
      </DestinationFrame>
      <SettingsSheet row={openRow} onClose={() => setOpenRow(null)} />
    </>
  );
}

export function YouControlsDestination() {
  const session = useConceptSession("you");
  const [openRow, setOpenRow] = useState<ControlRow | null>(null);

  return (
    <>
      <DestinationFrame
        family="you"
        concept={controls}
        siblings={YOU_CONCEPTS}
        session={session}
        kicker="Product"
        heading="Controls"
        subtitle="No hero identity. Groups, then sheets."
        aside={
          <div>
            <p className="text-sm font-medium">Why this direction</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You is not a dashboard and not a profile network. It is how the
              product is configured. Identity is a row under Account.
            </p>
          </div>
        }
      >
        <div className="md:max-w-xl">
          {youControlGroups.map((group) => (
            <section key={group.id} className="mt-6 first:mt-0">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h2>
              <ul className="mt-1">
                {group.rows.map((row) => (
                  <SettingsRow key={row.id} row={row} onOpen={setOpenRow} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DestinationFrame>
      <SettingsSheet row={openRow} onClose={() => setOpenRow(null)} />
    </>
  );
}

function SettingsRow({
  row,
  onOpen,
}: {
  row: ControlRow;
  onOpen: (row: ControlRow) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(row)}
        className="flex w-full items-start justify-between gap-3 border-b border-border/50 py-3 text-left touch-manipulation"
      >
        <span>
          <span className="block text-[15px] font-semibold tracking-tight">
            {row.label}
          </span>
          <span className="text-xs text-muted-foreground">{row.value}</span>
        </span>
      </button>
    </li>
  );
}

function SettingsSheet({
  row,
  onClose,
}: {
  row: ControlRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row?.label ?? "Setting"}</DialogTitle>
          <DialogDescription>{row?.value}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Prototype sheet. Production would reuse the existing settings
          sections — timezone, notifications, Health, sign out — without nested
          cards as the default atom.
        </p>
      </DialogContent>
    </Dialog>
  );
}
