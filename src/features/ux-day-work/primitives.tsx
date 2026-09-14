"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import {
  CADENCE_CHOICES,
  DATE_CHOICES,
  DEADLINE_CHOICES,
  DIFFICULTY_CHOICES,
  TIME_CHOICES,
  cadenceCountDisplay,
  cadenceLabel,
  cadenceUnitDisplay,
  currentInstance,
  deadlineLabel,
  difficultyLabel,
  effortLevel,
  periodLabel,
  sittingLabel,
  timeLabel,
  type DayWorkFact,
  type DayWorkItem,
} from "@/features/ux-day-work/seed";
import type { DayWorkSession } from "@/features/ux-day-work/session";

export function DayShell({
  remaining,
  eyebrow = "Checklist · Thursday",
  children,
}: {
  remaining: number;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="dw-stage mx-auto max-w-xl overflow-hidden">
      <div className="flex items-end justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--dw-rule)" }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            September 3
          </h2>
        </div>
        <p className="font-mono text-sm text-[color:var(--dw-deep)]">{remaining} left</p>
      </div>
      <div className="dw-list px-4 py-2 sm:px-5">{children}</div>
    </div>
  );
}

export function WorkRow({
  item,
  open,
  onOpen,
  onComplete,
  children,
}: {
  item: DayWorkItem;
  open: boolean;
  onOpen: () => void;
  onComplete: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="dw-row">
      <CompletionToggle
        completed={item.completed}
        size="sm"
        aria-label={`Mark ${item.title} complete`}
        onClick={() => onComplete()}
      />
      <div className="dw-row-main">
        <button
          type="button"
          className="dw-row-title"
          data-done={item.completed}
          aria-expanded={open}
          onClick={onOpen}
        >
          {item.title}
        </button>
        <p className="dw-row-meta">
          {item.unplaced
            ? "Unplaced"
            : item.kind === "task"
              ? "Task"
              : item.categoryLabel}
          {item.time ? ` · ${timeLabel(item)}` : ""}
        </p>
        {children}
      </div>
    </div>
  );
}

export function Fact({
  fact,
  active,
  onSelect,
  children,
}: {
  fact: DayWorkFact;
  active: boolean;
  onSelect: (fact: DayWorkFact) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="dw-fact"
      data-active={active}
      aria-pressed={active}
      onClick={() => onSelect(fact)}
    >
      {children}
    </button>
  );
}

export function FactChoices({
  item,
  fact,
  onChoose,
}: {
  item: DayWorkItem;
  fact: DayWorkFact;
  onChoose: (value: string | null) => void;
}) {
  if (fact === "title") {
    return <TitleEditor value={item.title} onCommit={(value) => onChoose(value)} />;
  }
  if (fact === "cadence") {
    return (
      <ChipRow
        options={CADENCE_CHOICES.map((choice) => ({
          id: choice.id,
          label: choice.label,
          pressed: cadenceLabel(item) === choice.label,
        }))}
        onChoose={onChoose}
      />
    );
  }
  if (fact === "deadline") {
    return (
      <ChipRow
        options={DEADLINE_CHOICES.map((choice) => ({
          id: choice.value ?? "none",
          label: choice.label,
          pressed: item.endDate === choice.value,
        }))}
        onChoose={(id) => onChoose(id === "none" ? null : id)}
      />
    );
  }
  if (fact === "time") {
    return (
      <ChipRow
        options={TIME_CHOICES.map((choice) => ({
          id: choice.value ?? "any",
          label: choice.label,
          pressed: item.time === choice.value,
        }))}
        onChoose={(id) => onChoose(id === "any" ? null : id)}
      />
    );
  }
  if (fact === "date") {
    return (
      <ChipRow
        options={DATE_CHOICES.map((choice) => ({
          id: choice.value,
          label: choice.label,
          pressed: currentInstance(item).date === choice.value,
        }))}
        onChoose={onChoose}
      />
    );
  }
  if (fact === "difficulty") {
    return (
      <ChipRow
        options={DIFFICULTY_CHOICES.map((choice) => ({
          id: choice.id,
          label: choice.label,
          pressed: item.difficulty === choice.id,
        }))}
        onChoose={onChoose}
      />
    );
  }
  return (
    <ChipRow
      options={[
        {
          id: "lock",
          label: item.locked ? "Unlock this sitting" : "Lock this sitting",
          pressed: item.locked,
        },
      ]}
      onChoose={() => onChoose("toggle")}
    />
  );
}

function ChipRow({
  options,
  onChoose,
}: {
  options: Array<{ id: string; label: string; pressed: boolean }>;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="dw-chips" role="group">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="dw-choice"
          aria-pressed={option.pressed}
          onClick={() => onChoose(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TitleEditor({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        onCommit(draft.trim() || value);
      }}
    >
      <input
        ref={ref}
        className="dw-title-edit"
        value={draft}
        aria-label="Goal title"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onCommit(draft.trim() || value)}
      />
    </form>
  );
}

export function EffortBars({ item }: { item: DayWorkItem }) {
  const effort = effortLevel(item);
  return (
    <span className="dw-effort" aria-label={`${difficultyLabel(item)} effort`}>
      {[1, 2, 3].map((level) => (
        <i key={level} data-active={level <= effort} style={{ height: 6 + level * 5 }} />
      ))}
    </span>
  );
}

export function FolioCard({
  item,
  session,
}: {
  item: DayWorkItem;
  session: DayWorkSession;
}) {
  const unit = cadenceUnitDisplay(item);
  const editing = session.selectedId === item.id ? session.editingFact : null;
  const selectFact = (fact: DayWorkFact) =>
    session.setEditingFact((current) => (current === fact ? null : fact));

  return (
    <article
      className="dw-folio mt-3"
      style={{ "--goal-color": item.color } as CSSProperties}
    >
      <div className="dw-folio-kicker">
        <span>Your commitment, as it stands</span>
        <InstanceNav item={item} session={session} />
      </div>
      <div className="dw-folio-target">
        <strong>
          <Fact fact="cadence" active={editing === "cadence"} onSelect={selectFact}>
            {cadenceCountDisplay(item)}
          </Fact>
        </strong>
        <span>
          {unit.primary}
          <br />
          {unit.secondary}
        </span>
      </div>
      <h3>
        <Fact fact="title" active={editing === "title"} onSelect={selectFact}>
          {item.title}
        </Fact>
      </h3>
      <div className="dw-folio-bottom">
        <div className="space-y-1 text-[0.8rem] leading-relaxed">
          <p>
            <Fact fact="date" active={editing === "date"} onSelect={selectFact}>
              {sittingLabel(item)}
            </Fact>
            {" · "}
            <Fact fact="time" active={editing === "time"} onSelect={selectFact}>
              {timeLabel(item)}
            </Fact>
          </p>
          <p>
            {item.categoryLabel}
            {" · "}
            <Fact fact="deadline" active={editing === "deadline"} onSelect={selectFact}>
              {deadlineLabel(item)}
            </Fact>
          </p>
          <p className="text-[0.72rem] uppercase tracking-[0.08em] opacity-70">
            {periodLabel(item)}
            {" · "}
            <Fact fact="lock" active={editing === "lock"} onSelect={selectFact}>
              {item.locked ? "Locked" : "Unlocked"}
            </Fact>
          </p>
        </div>
        <Fact fact="difficulty" active={editing === "difficulty"} onSelect={selectFact}>
          <EffortBars item={item} />
        </Fact>
      </div>
      {editing ? (
        <FactChoices
          item={item}
          fact={editing}
          onChoose={(value) => session.applyFact(item.id, editing, value)}
        />
      ) : (
        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.12em] opacity-55">
          Tap a fact to change it
        </p>
      )}
    </article>
  );
}

export function PhraseBlock({
  item,
  session,
}: {
  item: DayWorkItem;
  session: DayWorkSession;
}) {
  const editing = session.selectedId === item.id ? session.editingFact : null;
  const selectFact = (fact: DayWorkFact) =>
    session.setEditingFact((current) => (current === fact ? null : fact));
  const instance = currentInstance(item);

  return (
    <div className="mt-2">
      <p className="dw-phrase">
        <Fact fact="title" active={editing === "title"} onSelect={selectFact}>
          {item.title}
        </Fact>{" "}
        is{" "}
        <Fact fact="cadence" active={editing === "cadence"} onSelect={selectFact}>
          {cadenceLabel(item).toLowerCase()}
        </Fact>
        ,{" "}
        <Fact fact="deadline" active={editing === "deadline"} onSelect={selectFact}>
          {deadlineLabel(item).toLowerCase()}
        </Fact>
        ,{" "}
        <Fact fact="date" active={editing === "date"} onSelect={selectFact}>
          {item.unplaced ? "unplaced from Tuesday" : `this ${instance.weekday.toLowerCase()}`}
        </Fact>{" "}
        at{" "}
        <Fact fact="time" active={editing === "time"} onSelect={selectFact}>
          {timeLabel(item).toLowerCase()}
        </Fact>
        . {periodLabel(item)}.{" "}
        <Fact fact="difficulty" active={editing === "difficulty"} onSelect={selectFact}>
          {difficultyLabel(item)}
        </Fact>
        ,{" "}
        <Fact fact="lock" active={editing === "lock"} onSelect={selectFact}>
          {item.locked ? "locked" : "unlocked"}
        </Fact>
        .
      </p>
      {editing ? (
        <FactChoices
          item={item}
          fact={editing}
          onChoose={(value) => session.applyFact(item.id, editing, value)}
        />
      ) : (
        <p className="mt-2 text-[0.68rem] uppercase tracking-[0.12em] text-[color:var(--dw-muted)]">
          Tap a phrase · {item.private ? "Private" : item.categoryLabel}
        </p>
      )}
    </div>
  );
}

export function InstanceNav({
  item,
  session,
}: {
  item: DayWorkItem;
  session: DayWorkSession;
}) {
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="opacity-70 disabled:opacity-25"
        aria-label="Previous sitting"
        disabled={!session.canShift(item, -1)}
        onClick={() => session.shiftInstance(item.id, -1)}
      >
        Prev
      </button>
      <button
        type="button"
        className="opacity-70 disabled:opacity-25"
        aria-label="Next sitting"
        disabled={!session.canShift(item, 1)}
        onClick={() => session.shiftInstance(item.id, 1)}
      >
        Next
      </button>
    </span>
  );
}

export function PeekFacts({
  item,
  session,
}: {
  item: DayWorkItem;
  session: DayWorkSession;
}) {
  const editing = session.editingFact;
  const selectFact = (fact: DayWorkFact) =>
    session.setEditingFact((current) => (current === fact ? null : fact));
  const rows: Array<{ fact: DayWorkFact; label: string; value: string }> = [
    { fact: "cadence", label: "Rhythm", value: cadenceLabel(item) },
    { fact: "deadline", label: "Horizon", value: deadlineLabel(item) },
    { fact: "date", label: "This sitting", value: sittingLabel(item) },
    { fact: "time", label: "Time", value: timeLabel(item) },
    { fact: "difficulty", label: "Effort", value: difficultyLabel(item) },
    { fact: "lock", label: "Pin", value: item.locked ? "Locked" : "Unlocked" },
  ];

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--dw-muted)]">
        {item.categoryLabel}
        {item.private ? " · Private" : ""} · {periodLabel(item)}
      </p>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.fact} className="flex items-baseline justify-between gap-4">
            <dt className="text-[0.68rem] uppercase tracking-[0.12em] text-[color:var(--dw-muted)]">
              {row.label}
            </dt>
            <dd className="text-right font-display text-lg tracking-tight">
              <Fact fact={row.fact} active={editing === row.fact} onSelect={selectFact}>
                {row.value}
              </Fact>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-[color:var(--dw-deep)]">
        {sittingLabel(item)}
        {item.time ? ` · ${timeLabel(item)}` : ""} · from {item.startDate}
      </p>
      {editing ? (
        <FactChoices
          item={item}
          fact={editing}
          onChoose={(value) => session.applyFact(item.id, editing, value)}
        />
      ) : (
        <p className="mt-4 text-[0.68rem] uppercase tracking-[0.12em] text-[color:var(--dw-muted)]">
          Tap a fact to change it
        </p>
      )}
    </div>
  );
}
