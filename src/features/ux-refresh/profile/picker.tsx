"use client";

import { useState } from "react";
import { Action, Search, Segments } from "../primitives";
import { Pin, Check } from "lucide-react";
import { MedalMark } from "@/features/achievements/medals";
import { PIN_LIMIT, togglePin } from "@/features/ux-profile/model";
import { PIN_CATALOG } from "../sample";

export function PinPicker({
  formId,
  onDone,
  initialPins = ["level8", "streak", "half"],
}: {
  formId: string;
  onDone: (pins: string[]) => void;
  initialPins?: string[];
}) {
  const [pins, setPins] = useState(initialPins);
  const [kind, setKind] = useState("All");
  const [query, setQuery] = useState("");
  const visible = PIN_CATALOG.filter(
    (item) =>
      (kind === "All" || item.kind === kind) &&
      `${item.name} ${item.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        onDone(pins);
      }}
    >
      <div className="rf-row mt-6">
        <h3 className="type-heading">Your showcase</h3>
        <p className="type-figure" role="status">
          {pins.length} / {PIN_LIMIT} pinned
        </p>
      </div>
      <div className="rf-pin-slots">
        {Array.from({ length: PIN_LIMIT }, (_, index) => {
          const item = PIN_CATALOG.find((entry) => entry.id === pins[index]);
          return (
            <div className="rf-pin-slot" key={index}>
              {item ? (
                <>
                  <span className="type-item">{item.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => setPins(pins.filter((id) => id !== item.id))}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <span className="rf-muted">Choose a pin</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="rf-stack">
        <Segments
          label="Showcase categories"
          values={["All", "Medals", "Records", "Finished goals"]}
          value={kind}
          onChange={setKind}
        />
        <Search
          value={query}
          onChange={setQuery}
          label="Search your medals, records and goals"
        />
      </div>
      <div className="mt-4">
        {visible.map((item) => {
          const selected = pins.includes(item.id);
          const full = pins.length === PIN_LIMIT && !selected;
          return (
            <div className="rf-check-row" key={item.id}>
              <span aria-hidden>
                {item.kind === "Medals" ? (
                  <MedalMark level={item.id === "level8" ? 8 : 6} size={44} />
                ) : (
                  <Pin size={22} />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <strong className="type-item">{item.name}</strong>
                <small>
                  {item.kind} · {item.detail}
                </small>
              </span>
              <Action
                type="button"
                variant={selected ? "secondary" : "outline"}
                disabled={full}
                aria-pressed={selected}
                aria-label={`${selected ? "Unpin" : "Pin"} ${item.name}`}
                onClick={() => setPins([...togglePin(pins, item.id).pins])}
              >
                {selected ? (
                  <Check size={16} aria-hidden />
                ) : (
                  <Pin size={16} aria-hidden />
                )}
                {selected ? "Pinned" : "Pin"}
              </Action>
            </div>
          );
        })}
      </div>
      {!visible.length && (
        <p className="rf-muted mt-6">No matches in this category.</p>
      )}
      <p className="rf-muted mt-6">
        {pins.length === PIN_LIMIT
          ? "Your three places are filled. Remove a pin to choose another."
          : "Choose what you want to remember and share."}
      </p>
    </form>
  );
}
