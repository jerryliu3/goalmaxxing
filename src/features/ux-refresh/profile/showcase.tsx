"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  Heading,
  Notice,
  Panel,
  StudyDialog,
} from "../primitives";
import { Pin } from "lucide-react";
import { PIN_CATALOG } from "../sample";
import { PinPicker } from "./picker";

export function ShowcaseConcept() {
  const [open, setOpen] = useState(false);
  const [pins, setPins] = useState(["level8", "streak", "half"]);
  const [message, setMessage] = useState("");
  return (
    <>
      <AppNav profile />
      <div className="rf-canvas">
        <Heading eyebrow="Your profile" title="Three things worth sharing.">
          <Action onClick={() => setOpen(true)}>Edit showcase</Action>
        </Heading>
        <Panel>
          <div className="rf-pin-slots">
            {pins.map((id) => (
              <div className="rf-pin-slot" key={id}>
                <Pin aria-hidden size={20} />
                <p className="type-item">
                  {PIN_CATALOG.find((item) => item.id === id)?.name}
                </p>
              </div>
            ))}
            {pins.length === 0 && (
              <p className="rf-muted">
                No pins yet. Choose something you are proud of.
              </p>
            )}
          </div>
        </Panel>
        <div className="mt-4">
          <Notice>{message}</Notice>
        </div>
        <StudyDialog
          open={open}
          onOpenChange={setOpen}
          title="Choose your showcase"
          description="Up to three medals, records or finished goals."
          footer={
            <>
              <Action variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Action>
              <Action form="showcase-pins" type="submit">
                Done
              </Action>
            </>
          }
        >
          {open && (
            <PinPicker
              initialPins={pins}
              formId="showcase-pins"
              onDone={(next) => {
                setPins(next);
                setMessage("Sample showcase updated.");
                setOpen(false);
              }}
            />
          )}
        </StudyDialog>
      </div>
    </>
  );
}
