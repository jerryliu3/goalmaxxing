"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { getTheme, type ThemeId } from "@cadence/shared/brand";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { StudyThemeAssets } from "@/components/brand/study-theme-assets";
import { REFRESH_CONCEPTS, type RefreshConcept } from "./catalog";
import { Action, PreviewTheme } from "./primitives";
import {
  CardsConcept,
  DialogsConcept,
  CopyConcept,
  ScopeConcept,
} from "./shared";
import { AgendaConcept } from "./agenda/agenda";
import { RecoveryConcept } from "./agenda/recovery";
import { WeekConcept } from "./agenda/week";
import { LanesConcept } from "./agenda/lanes";
import { PlannerSettingsConcept } from "./agenda/settings";
import { PhoneAgendaConcept } from "./agenda/phone";
import { TrackerConcept } from "./growth/tracker";
import { ScoreConcept } from "./growth/score";
import { GrowthConcept } from "./growth/composition";
import { MedalsConcept } from "./growth/medals";
import { RecordsConcept } from "./growth/records";
import { ProfileConcept } from "./profile/profile";
import { ShowcaseConcept } from "./profile/showcase";
import { PreferencesConcept } from "./profile/settings";
import { BooksConcept } from "./goals/books";
import { CollectionConcept } from "./goals/collection";
import { EditorConcept } from "./goals/editor";
import { CreationConcept } from "./goals/creation";
import { CommunityConcept } from "./community";

function Demo({ slug, variant }: { slug: string; variant: number }) {
  switch (slug) {
    case "readable-cards":
      return <CardsConcept variant={variant} />;
    case "agenda-hierarchy":
      return <AgendaConcept variant={variant} />;
    case "recovery-actions":
      return <RecoveryConcept variant={variant} />;
    case "tracker-selection":
      return <TrackerConcept variant={variant} selectionStudy />;
    case "tracker-calendar":
      return <TrackerConcept variant={variant} />;
    case "profile-location":
      return <ProfileConcept variant={variant} />;
    case "dialogs":
      return <DialogsConcept variant={variant} />;
    case "goal-score":
      return <ScoreConcept />;
    case "past-goals":
      return <BooksConcept />;
    case "week-day":
      return <WeekConcept />;
    case "goal-view":
      return <LanesConcept />;
    case "planner-settings":
      return <PlannerSettingsConcept />;
    case "growth-composition":
      return <GrowthConcept />;
    case "medals":
      return <MedalsConcept />;
    case "records":
      return <RecordsConcept />;
    case "showcase-picker":
      return <ShowcaseConcept />;
    case "preferences":
      return <PreferencesConcept />;
    case "plain-copy":
      return <CopyConcept />;
    case "community":
      return <CommunityConcept />;
    case "navigation-scope":
      return <ScopeConcept />;
    case "goal-collection":
      return <CollectionConcept />;
    case "goal-editor":
      return <EditorConcept />;
    case "phone-agenda":
      return <PhoneAgendaConcept />;
    case "goal-creation":
      return <CreationConcept />;
    default:
      return null;
  }
}

export function RefreshStudy({
  concept,
  variant,
}: {
  concept: RefreshConcept;
  variant: number;
}) {
  const { styleId, options } = useUiStyle();
  const [theme, setTheme] = useState<ThemeId>(styleId);
  const [phone, setPhone] = useState(false);
  const [revision, setRevision] = useState(0);
  const index = REFRESH_CONCEPTS.findIndex(
    (item) => item.slug === concept.slug,
  );
  const previous = REFRESH_CONCEPTS[index - 1];
  const next = REFRESH_CONCEPTS[index + 1];
  const selected = concept.variants[variant];
  return (
    <PreviewTheme.Provider value={theme}>
      <main className="rf-lab" data-ui-style={theme}>
        <StudyThemeAssets theme={getTheme(theme)} />
        <header className="rf-top">
          <Link href="/ux/refresh">
            <ArrowLeft size={16} aria-hidden />
            All findings
          </Link>
          <span className="type-figure text-sm">
            {String(concept.id).padStart(2, "0")} / 24 · {concept.area}
          </span>
        </header>
        <div className="rf-main">
          <div className="rf-intro">
            <span className="rf-badge" data-priority={concept.priority}>
              {concept.priority} priority
            </span>
            <h1 className="type-title">{concept.title}</h1>
            <p>{concept.problem}</p>
          </div>
          <div className="rf-toolbar">
            <nav className="rf-variants" aria-label="Concept alternatives">
              {concept.variants.map((item, i) => (
                <Link
                  key={item.name}
                  prefetch={false}
                  href={`/ux/refresh/${concept.slug}${i ? "?variant=b" : ""}`}
                  aria-current={i === variant ? "page" : undefined}
                >
                  {String.fromCharCode(65 + i)} · {item.name}
                </Link>
              ))}
            </nav>
            <div>
              <label className="rf-muted">
                Preview theme{" "}
                <select
                  aria-label="Preview theme"
                  className="rf-select ml-2"
                  value={theme}
                  onChange={(event) => {
                    const option = options.find(
                      (item) => item.id === event.target.value,
                    );
                    if (option) setTheme(option.id);
                  }}
                >
                  {options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <Action
                variant="outline"
                aria-pressed={phone}
                onClick={() => setPhone(!phone)}
              >
                {phone ? "Full canvas" : "Phone canvas"}
              </Action>
              <Action
                variant="ghost"
                onClick={() => setRevision((value) => value + 1)}
              >
                <RotateCcw size={16} aria-hidden />
                Reset sample
              </Action>
            </div>
          </div>
          <p className="rf-muted mb-4">
            {selected.premise}{" "}
            <span className="block mt-2 text-xs">
              Sample only · no account writes · theme preview does not change
              your preference. Phone canvas resizes the page content; dialogs
              use your actual viewport.
            </span>
          </p>
          <div className="rf-preview-wrap">
            <div className="rf-stage" data-phone={phone}>
              <Demo
                key={`${concept.slug}-${variant}-${revision}`}
                slug={concept.slug}
                variant={variant}
              />
            </div>
          </div>
          <dl className="rf-note">
            <div>
              <dt className="type-eyebrow">Try it</dt>
              <dd>{concept.exercise}</dd>
            </div>
            <div>
              <dt className="type-eyebrow">Tradeoff</dt>
              <dd>{selected.tradeoff}</dd>
            </div>
            <div>
              <dt className="type-eyebrow">Production boundary</dt>
              <dd>
                Visual and interaction proposal. Keep production ownership,
                privacy, completion and save rules in their canonical paths when
                adopting a direction.
              </dd>
            </div>
          </dl>
          <nav aria-label="Findings" className="rf-foot">
            {previous ? (
              <Link
                href={`/ux/refresh/${previous.slug}`}
                className="rf-actions min-h-11"
              >
                <ArrowLeft aria-hidden size={16} />
                {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/ux/refresh/${next.slug}`}
                className="rf-actions min-h-11"
              >
                {next.title}
                <ArrowRight aria-hidden size={16} />
              </Link>
            )}
          </nav>
        </div>
      </main>
    </PreviewTheme.Provider>
  );
}
