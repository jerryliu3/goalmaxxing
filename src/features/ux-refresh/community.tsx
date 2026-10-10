"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Action,
  AppNav,
  Heading,
  Notice,
  Panel,
  StudyDialog,
} from "./primitives";
import { sampleDayLabel } from "./sample";

export function CommunityConcept() {
  const [day, setDay] = useState(8);
  const [open, setOpen] = useState(false);
  const counts: Record<number, number> = {
    5: 2,
    6: 3,
    7: 2,
    8: 1,
    9: 0,
    10: 0,
    11: 0,
  };
  return (
    <>
      <AppNav active="Community" />
      <div className="rf-canvas">
        <Heading eyebrow="Maya + Alex" title="A little company helps." />
        <div className="rf-split rf-split-equal">
          <Panel>
            <div className="rf-row">
              <h3 className="type-heading">October standings</h3>
              <span className="rf-muted">24 days left</span>
            </div>
            <p className="rf-muted my-4">
              Ranked by sessions completed in October.
            </p>
            <table className="rf-leaderboard">
              <caption className="sr-only">Sample October leaderboard</caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Member</th>
                  <th scope="col">Sessions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <th scope="row">Maya · you</th>
                  <td>12</td>
                </tr>
                <tr>
                  <td>2</td>
                  <th scope="row">Alex · partner</th>
                  <td>8</td>
                </tr>
              </tbody>
            </table>
          </Panel>
          <Panel>
            <h3 className="type-heading">Your shared week</h3>
            <p className="rf-muted my-4">October 5–11 · combined completions</p>
            <div className="rf-week">
              {[5, 6, 7, 8, 9, 10, 11].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={day === value}
                  aria-label={`${sampleDayLabel(value)}, ${value > 8 ? "Future" : `${counts[value]} team completions`}`}
                  onClick={() => setDay(value)}
                >
                  <small>Oct</small>
                  <span>{value}</span>
                  <small>
                    {value > 8 ? "Future" : `${counts[value]} done`}
                  </small>
                </button>
              ))}
            </div>
            <Notice>
              {sampleDayLabel(day)} ·{" "}
              {day > 8
                ? "A day ahead, with room for your plans."
                : `${counts[day]} completions between you.`}
            </Notice>
          </Panel>
        </div>
        <Panel className="mt-6">
          <div className="rf-row">
            <div>
              <h3 className="type-heading">A goal to work on together</h3>
              <p className="rf-muted mt-3">
                No shared goals yet. Choose an existing goal you both want to
                follow.
              </p>
            </div>
            <Action variant="outline" onClick={() => setOpen(true)}>
              About shared goals
            </Action>
          </div>
        </Panel>
        <StudyDialog
          open={open}
          onOpenChange={setOpen}
          title="Choose what to share"
          description="An empty state with a clear next step."
        >
          <p className="mt-6">
            A production implementation should open the existing shared-goal
            workflow, respecting each goal&apos;s visibility and ownership. This
            study does not add an invitation or sharing mutation.
          </p>
          <Action variant="outline" className="mt-6" asChild>
            <Link href="/ux/refresh/goal-collection">
              Browse the sample goals
            </Link>
          </Action>
        </StudyDialog>
      </div>
    </>
  );
}
