"use client";

import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import { GOALS } from "@/features/ux-profile/seed";
import { SAMPLE_GOALS, type SampleGoalId } from "./sample";

export const PreviewTheme = createContext("gazetteer");
export function Action(props: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={`min-h-11 rounded-lg px-4 ${props.className ?? ""}`}
    />
  );
}
export function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="rf-heading">
      {eyebrow && <p className="type-eyebrow">{eyebrow}</p>}
      <h2 className="type-title">{title}</h2>
      {children}
    </header>
  );
}
export function Panel({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section aria-label={label} className={`rf-panel ${className}`}>
      {children}
    </section>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rf-notice" role="status" aria-live="polite">
      {children}
    </p>
  );
}
export function Segments<T extends string>({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="rf-segments" role="group" aria-label={label}>
      {values.map((item) => (
        <button
          type="button"
          key={item}
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
export function Search({
  value,
  onChange,
  label = "Search goals",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <label className="rf-search">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
export function AppNav({
  active = "Agenda",
  profile = false,
}: {
  active?: string;
  profile?: boolean;
}) {
  const destinations = [
    ["Agenda", "agenda-hierarchy"],
    ["Goals", "goal-collection"],
    ["Growth", "growth-composition"],
    ["Community", "community"],
  ];
  return (
    <nav className="rf-app-nav" aria-label="Sample application">
      <span className="type-wordmark rf-wordmark">Goalmaxxing</span>
      <div>
        {destinations.map(([label, slug]) => (
          <Link
            key={label}
            href={`/ux/refresh/${slug}`}
            aria-current={!profile && label === active ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
      <Link
        className="rf-avatar"
        aria-label={profile ? "Profile, current page" : "Open sample profile"}
        aria-current={profile ? "page" : undefined}
        href="/ux/refresh/profile-location"
      >
        MC
      </Link>
    </nav>
  );
}
export function GoalArtifact({
  id,
  completed,
  plate = false,
  nameOverride,
  targetOverride,
  rotatable = false,
}: {
  id: SampleGoalId;
  completed: number;
  plate?: boolean;
  nameOverride?: string;
  targetOverride?: number;
  rotatable?: boolean;
}) {
  const goal = SAMPLE_GOALS.find((item) => item.id === id)!;
  const name = nameOverride ?? goal.name;
  const target = targetOverride ?? goal.target;
  const fields = {
    ...goalCardFields(GOALS[goal.artifact]),
    title: name,
    target_count: String(target),
    frequency_type: "recurring" as const,
    recurrence_interval: "monthly" as const,
    target_basis: "lifetime" as const,
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    default_local_time: "",
  };
  return (
    <article className={`rf-goal-object ${plate ? "rf-label-plate" : ""}`}>
      <div
        aria-hidden={rotatable ? undefined : true}
        className="rf-artwork"
        data-interactive={rotatable}
      >
        <TempoGoalCard
          fields={fields}
          context="history"
          assembly={{ completed, target }}
          flat={!rotatable}
          rotatable={rotatable}
          renderLettering={(text) => text}
        />
      </div>
      <div className="rf-caption">
        <p className="type-eyebrow">{goal.category} · October</p>
        <h3 className="type-item">{name}</h3>
        <p className="type-figure">
          {completed} / {target} completions
        </p>
        <progress
          aria-label={`${name} progress`}
          value={completed}
          max={target}
        />
      </div>
    </article>
  );
}
export function StudyDialog({
  open,
  onOpenChange,
  title,
  description,
  side = false,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  side?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const theme = useContext(PreviewTheme);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ui-style={theme}
        className={`rf-dialog ${side ? "rf-side-dialog" : ""}`}
      >
        <DialogHeader className="rf-dialog-head">
          <DialogTitle className="type-title text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="rf-dialog-body">{children}</div>
        <footer className="rf-dialog-foot">
          {footer ?? <Action onClick={() => onOpenChange(false)}>Done</Action>}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
export function SettingRow({
  title,
  detail,
  onClick,
}: {
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="rf-setting-row" onClick={onClick}>
      <span>
        <strong className="type-item">{title}</strong>
        <small>{detail}</small>
      </span>
      <ChevronRight aria-hidden size={18} />
    </button>
  );
}
export function WorkRow({
  title,
  meta,
  done,
  onToggle,
  onOpen,
}: {
  title: string;
  meta: string;
  done?: boolean;
  onToggle: () => void;
  onOpen?: () => void;
}) {
  return (
    <div className="rf-work-row" data-done={done || undefined}>
      <button
        type="button"
        className="rf-complete"
        aria-label={`${done ? "Undo completion of" : "Complete"} ${title}`}
        aria-pressed={!!done}
        onClick={onToggle}
      >
        {done && <Check aria-hidden size={18} />}
      </button>
      <div>
        {onOpen ? (
          <button
            type="button"
            className="type-item rf-work-title"
            onClick={onOpen}
          >
            {title}
            <ArrowRight aria-hidden size={16} />
          </button>
        ) : (
          <p className="type-item">{title}</p>
        )}
        <small>{meta}</small>
      </div>
    </div>
  );
}
