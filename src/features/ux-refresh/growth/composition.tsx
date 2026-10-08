"use client";

import { useState } from "react";
import { Action, AppNav, Heading, Panel } from "../primitives";
import { ScoreConcept } from "./score";
import { TrackerConcept } from "./tracker";
import { MedalsConcept } from "./medals";
import { RecordsConcept } from "./records";

export function GrowthConcept() {
  const [details, setDetails] = useState(false);
  return (
    <>
      <AppNav active="Growth" />
      <div className="rf-canvas">
        <Heading eyebrow="October 2026" title="Growth">
          <p className="rf-muted">
            Your activity, then the things worth keeping.
          </p>
        </Heading>
        <div className="rf-stack">
          <ScoreConcept embedded />
          <section>
            <h3 className="type-heading text-2xl mb-5">Activity</h3>
            <TrackerConcept embedded />
          </section>
          <section>
            <div className="rf-row mb-5">
              <h3 className="type-heading text-2xl">Records</h3>
              <Action
                variant="ghost"
                aria-expanded={details}
                onClick={() => setDetails(!details)}
              >
                {details ? "Close detail" : "Explore records"}
              </Action>
            </div>
            {details ? (
              <RecordsConcept embedded />
            ) : (
              <Panel>
                <div className="rf-row">
                  <p>
                    <span className="type-stat text-2xl">21 days</span>
                    <span className="block rf-muted">Best day streak</span>
                  </p>
                  <p>
                    <span className="type-stat text-2xl">9 weeks</span>
                    <span className="block rf-muted">Active-week streak</span>
                  </p>
                  <p>
                    <span className="type-stat text-2xl">4 goals</span>
                    <span className="block rf-muted">Accomplished</span>
                  </p>
                </div>
              </Panel>
            )}
          </section>
          <section>
            <h3 className="type-heading text-2xl mb-5">Medals</h3>
            <MedalsConcept embedded />
          </section>
        </div>
      </div>
    </>
  );
}
