"use client";

import { useState } from "react";
import { AppNav, Heading, Panel } from "../primitives";
import { MedalMark } from "@/features/achievements/medals";

export function MedalsConcept({ embedded = false }: { embedded?: boolean }) {
  const [level, setLevel] = useState(8);
  const dates: Record<number, string> = {
    2: "January 19",
    4: "April 2",
    6: "July 14",
    8: "September 28",
  };
  return (
    <>
      {!embedded && <AppNav active="Growth" />}
      <div className={embedded ? "" : "rf-canvas"}>
        {!embedded && (
          <Heading
            eyebrow="Growth / Medals"
            title="Keep the earned things close."
          />
        )}
        <Panel>
          <div className="rf-medal-stage">
            <MedalMark level={level} size={190} />
            <div>
              <p className="type-eyebrow rf-muted">Earned milestone</p>
              <h3 className="type-title">Level {level}</h3>
              <p>You reached level {level}.</p>
              <p className="rf-muted mt-2">{dates[level]}, 2026</p>
            </div>
          </div>
          <div
            className="rf-medal-shelf"
            role="group"
            aria-label="Earned medal shelf"
          >
            {[2, 4, 6, 8].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={level === value}
                onClick={() => setLevel(value)}
              >
                <MedalMark level={value} size={56} />
                <span className="type-figure">Level {value}</span>
              </button>
            ))}
          </div>
          <p className="rf-muted text-center mt-5">
            4 earned medals · the shelf shows the milestones in this sample.
          </p>
        </Panel>
      </div>
    </>
  );
}
