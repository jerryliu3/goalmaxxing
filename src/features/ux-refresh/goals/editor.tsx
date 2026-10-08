"use client";

import { useState } from "react";
import { Action, AppNav, Heading, Panel } from "../primitives";
import { SAMPLE_GOALS } from "../sample";
import { GoalDetails } from "./details";

export function EditorConcept() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>(SAMPLE_GOALS[0].name);
  return (
    <>
      <AppNav active="Goals" />
      <div className="rf-canvas">
        <Heading
          eyebrow="Goals / Details"
          title="Read first. Edit deliberately."
        />
        <Panel>
          <h3 className="type-title">{name}</h3>
          <p className="rf-muted my-5">4 / 12 completions · October 2026</p>
          <Action onClick={() => setOpen(true)}>Open goal details</Action>
        </Panel>
        {open && (
          <GoalDetails
            goalId="run"
            name={name}
            onClose={() => setOpen(false)}
            onRename={setName}
          />
        )}
      </div>
    </>
  );
}
