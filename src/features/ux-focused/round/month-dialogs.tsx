"use client";
import { useState } from "react";
import { Link2 } from "lucide-react";
import { Notice, StudyDialog } from "@/features/ux-refresh/primitives";
import { Action } from "../common";
import { TODAY, dateLabel } from "../model";
import { MONTH_GOALS, canPlace } from "./month-model";
import type { MonthRoundState } from "./use-month-round";
export function MonthDialogs({ month: m }: { month: MonthRoundState }) {
  const [recoveryDate, setRecoveryDate] = useState("2026-10-09");
  const s = m.selected;
  const missed = m.missed[0];
  return (
    <>
      <StudyDialog
        open={m.filters}
        onOpenChange={m.setFilters}
        title="Find your placed work"
        description="Filters change what you see; they never remove work from the plan."
      >
        <label className="rd-field">
          Search sessions
          <input
            type="search"
            value={m.query}
            onChange={(e) => m.setQuery(e.target.value)}
            placeholder="Title contains…"
          />
        </label>
        <label className="rd-field">
          Goal
          <select
            value={m.filter}
            onChange={(e) => m.setFilter(e.target.value)}
          >
            <option value="all">All goals & tasks</option>
            {MONTH_GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <Action
          variant="outline"
          onClick={() => {
            m.setFilter("all");
            m.setQuery("");
          }}
        >
          Clear filters
        </Action>
      </StudyDialog>
      <StudyDialog
        open={Boolean(s)}
        onOpenChange={(open) => !open && m.setSelectedId(null)}
        title={s?.title ?? "Session"}
        description={
          s
            ? `${s.person === "you" ? "Your session" : "Alex’s session"} · ${dateLabel(s.date)} · ${s.time} · ${s.duration} min`
            : ""
        }
        footer={
          s && s.person === "you" && !s.done ? (
            <Action
              disabled={
                !canPlace(s, m.proposedDate) || m.proposedDate === s.date
              }
              onClick={() => {
                m.dispatch({ type: "move", id: s.id, date: m.proposedDate });
                m.selectDay(m.proposedDate);
                m.setSelectedId(null);
                m.setNotice("Move staged. Review it below, then Save or Undo.");
              }}
            >
              Stage this move
            </Action>
          ) : (
            <Action onClick={() => m.setSelectedId(null)}>Done</Action>
          )
        }
      >
        {s && (
          <>
            <p className="type-heading">
              {MONTH_GOALS.find((g) => g.id === s.goal)?.title}
            </p>
            {s.linked && (
              <p className="rd-link-credit mt-4">
                <Link2 size={16} /> Completing this linked session also credits{" "}
                {s.linked} through the existing linked-goal rules.
              </p>
            )}
            {s.person === "partner" ? (
              <p className="rd-muted mt-4">
                Alex owns this work. You can inspect it, but cannot move or
                complete it.
              </p>
            ) : s.done ? (
              <p className="rd-muted mt-4">
                Already recorded. Remove its completion with the hold control
                before moving it.
              </p>
            ) : (
              <>
                <label className="rd-field">
                  Move to date
                  <input
                    type="date"
                    min={TODAY}
                    max={s.end}
                    value={m.proposedDate}
                    onChange={(e) => m.setProposedDate(e.target.value)}
                  />
                </label>
                <p className="rd-muted">
                  The goal ends {dateLabel(s.end)}. Date changes are staged
                  until you save the plan.
                </p>
                {m.proposedDate && !canPlace(s, m.proposedDate) && (
                  <Notice>
                    Choose a date from today through the goal’s end.
                  </Notice>
                )}
              </>
            )}
          </>
        )}
      </StudyDialog>
      <StudyDialog
        open={m.review}
        onOpenChange={m.setReview}
        title="Review the missed film session"
        description="Only this missed session. Applying or letting go saves this recovery decision immediately."
        footer={
          missed ? (
            <div className="rf-actions">
              <Action
                variant="outline"
                onClick={() => {
                  m.dispatch({ type: "let-go", id: missed.id });
                  m.setReview(false);
                  m.setNotice(
                    "Missed session let go. Its goal remains active.",
                  );
                }}
              >
                Let this session go
              </Action>
              <Action
                disabled={!canPlace(missed, recoveryDate)}
                onClick={() => {
                  m.dispatch({
                    type: "recover",
                    id: missed.id,
                    date: recoveryDate,
                  });
                  m.selectDay(recoveryDate);
                  m.setReview(false);
                  m.setNotice("Recovery applied to this session and saved.");
                }}
              >
                Apply recovery
              </Action>
            </div>
          ) : (
            <Action onClick={() => m.setReview(false)}>Done</Action>
          )
        }
      >
        {missed ? (
          <>
            <h4 className="type-heading">{missed.title}</h4>
            <p className="rd-muted">
              Missed {dateLabel(missed.date)} · Lifetime goal, still within its
              active period.
            </p>
            <label className="rd-field">
              Review its new date
              <input
                type="date"
                min={TODAY}
                max={missed.end}
                value={recoveryDate}
                onChange={(e) => setRecoveryDate(e.target.value)}
              />
            </label>
            <p className="rd-muted">
              Other sessions stay where they are. Nothing has changed just
              because you opened Review.
            </p>
          </>
        ) : (
          <p>No missed sessions need review.</p>
        )}
      </StudyDialog>
    </>
  );
}
