"use client";
import { useState } from "react";
import {
  PUBLIC_PROFILE_PIN_LIMIT,
  PUBLIC_PROFILE_RECORD_LIMIT,
  type PublicProfileShowcasePin,
} from "@cadence/shared/social/public-profile";
import { pinKey } from "@/features/social/public-profile/profile-draft";
import {
  ShowcaseThumb,
  showcaseItemName,
} from "@/features/social/public-profile/showcase-tile";
import { Search } from "@/features/ux-refresh/primitives";
import { Action } from "./common";
import { PROFILE_CATALOG } from "./profile-sample";

export function FocusedPicker({
  records,
  pins,
  onToggle,
}: {
  records: boolean;
  pins: readonly PublicProfileShowcasePin[];
  onToggle: (pin: PublicProfileShowcasePin) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const catalog = records
    ? PROFILE_CATALOG.records
    : [...PROFILE_CATALOG.medals, ...PROFILE_CATALOG.goals];
  const keys = new Set(pins.map(pinKey));
  const selected = catalog.filter((item) => keys.has(pinKey(item)));
  const limit = records
    ? PUBLIC_PROFILE_RECORD_LIMIT
    : PUBLIC_PROFILE_PIN_LIMIT;
  const visible = catalog.filter(
    (item) =>
      (category === "All" ||
        (category === "Medals"
          ? item.kind === "medal"
          : item.kind === "goal")) &&
      `${showcaseItemName(item)} ${item.kind === "goal" ? (item.achievedOn ?? "") : ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div>
      <div className="fc-picker-pinned">
        <div className="fc-between">
          <strong className="type-heading">
            {records ? "On your membership card" : "In your showcase"}
          </strong>
          <span className="type-figure" role="status">
            {selected.length}/{limit}
          </span>
        </div>
        <div className="fc-selected-pins">
          {selected.map((item) => (
            <div key={pinKey(item)}>
              <span className="type-item">{showcaseItemName(item)}</span>
              <Action
                variant="ghost"
                aria-label={`Remove ${showcaseItemName(item)}`}
                onClick={() => onToggle(item)}
              >
                Remove
              </Action>
            </div>
          ))}
          {!selected.length && (
            <p className="fc-muted">Choose what you want to show.</p>
          )}
        </div>
        <p className="fc-muted">
          {selected.length === limit
            ? "Remove a selected item to make room for another."
            : `${limit - selected.length} ${limit - selected.length === 1 ? "place" : "places"} available.`}
        </p>
      </div>
      <div className="fc-picker-tools">
        <Search
          value={query}
          onChange={setQuery}
          label={
            records
              ? "Search records"
              : "Search medals, finished goals or dates"
          }
        />
        {!records && (
          <div
            role="group"
            aria-label="Showcase categories"
            className="rf-segments"
          >
            {["All", "Medals", "Finished goals"].map((value) => (
              <button
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>
      <ul className="fc-list">
        {visible.map((item) => {
          const pinned = keys.has(pinKey(item));
          return (
            <li key={pinKey(item)} className="fc-line">
              <ShowcaseThumb item={item} />
              <div className="fc-grow">
                <strong className="type-item">{showcaseItemName(item)}</strong>
                <p className="fc-muted">
                  {item.kind === "goal"
                    ? `Finished ${item.achievedOn}`
                    : item.kind === "record"
                      ? item.value
                      : "Level medal"}
                </p>
              </div>
              <Action
                variant={pinned ? "secondary" : "outline"}
                aria-pressed={pinned}
                disabled={!pinned && selected.length >= limit}
                onClick={() => onToggle(item)}
                aria-label={`${pinned ? "Unpin" : "Pin"} ${showcaseItemName(item)}`}
              >
                {pinned ? "Pinned" : "Pin"}
              </Action>
            </li>
          );
        })}
      </ul>
      {!visible.length && (
        <p className="fc-muted my-6">
          No matching items. Your selected items remain available above.
        </p>
      )}
    </div>
  );
}
