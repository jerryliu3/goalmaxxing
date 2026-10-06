"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  MEDAL_DIRECTIONS,
  themeVars,
  type MedalDirection,
  type MedalsTheme,
} from "@/features/ux-medals/model";
import "@/features/ux-medals/medals.css";

/** Root for every medals page: scoped Gazetteer tokens plus a paper light/dark toggle. */
export function MedalsStage({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  const [theme, setTheme] = useState<MedalsTheme>("light");
  const dark = theme === "dark";
  return (
    <div className="md-root" data-theme={theme} style={themeVars(theme)}>
      <header className="md-hair border-b px-4 py-2 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {nav}
          <button
            type="button"
            className="md-button"
            aria-pressed={dark}
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {dark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
            Dark paper
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

export function DirectionNav({ direction }: { direction: MedalDirection }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <Link href="/ux/medals" className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <ArrowLeft aria-hidden className="size-4" />
        Medals
      </Link>
      <p className="md-kicker hidden sm:block">
        {direction.number} / {direction.name}
      </p>
      <nav aria-label="Medal directions">
        <ul className="flex gap-1">
          {MEDAL_DIRECTIONS.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/ux/medals/${item.slug}`}
                aria-label={`Open ${item.name}`}
                aria-current={item.slug === direction.slug ? "page" : undefined}
                className="md-chip"
              >
                {item.number}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function BetNote({ direction }: { direction: MedalDirection }) {
  const rows: [string, string][] = [
    ["Ranks", direction.naming],
    ["Locked", direction.locked],
    ["Unlock", direction.unlock],
    ["Small sizes", direction.small],
    ["Risk", direction.risk],
  ];
  return (
    <section className="md-hair mt-14 border-t pt-8" aria-label="The bet">
      <p className="md-kicker">The bet</p>
      <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight">{direction.thesis}</h2>
      <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([term, detail]) => (
          <div key={term}>
            <dt className="md-kicker">{term}</dt>
            <dd className="md-deep mt-1 leading-relaxed">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
