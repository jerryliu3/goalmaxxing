"use client";
import { useState } from "react";
import Link from "next/link";
import { getTheme, type ThemeId } from "@cadence/shared/brand";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { StudyThemeAssets } from "@/components/brand/study-theme-assets";
import { Action, PreviewTheme } from "@/features/ux-refresh/primitives";
import { BASELINE_COMMIT, type FocusedStudy } from "./catalog";
import { TeamStudy, TeamBaseline } from "./team";
import { MobileStudy, MobileBaseline } from "./mobile";
import { LandingStudy, LandingBaseline } from "./landing";
function Baseline({ slug }: { slug: string }) {
  if (slug === "phone-agenda") return <MobileBaseline />;
  if (slug === "mobile-landing") return <LandingBaseline />;
  return <TeamBaseline />;
}
function Proposal({ slug, variant }: { slug: string; variant: number }) {
  if (slug === "phone-agenda") return <MobileStudy variant={variant} />;
  if (slug === "mobile-landing") return <LandingStudy variant={variant} />;
  return <TeamStudy variant={variant} />;
}

export function FocusedStudyPage({
  study,
  variant,
}: {
  study: FocusedStudy;
  variant: number;
}) {
  const { styleId, options } = useUiStyle();
  const [theme, setTheme] = useState<ThemeId>(styleId);
  const [compare, setCompare] = useState(true);
  const [phone, setPhone] = useState(
    study.slug === "phone-agenda" || study.slug === "mobile-landing",
  );
  const [revision, setRevision] = useState(0);
  const selected = study.variants[variant];
  return (
    <PreviewTheme.Provider value={theme}>
      <main className="rf-lab fc-lab" data-ui-style={theme}>
        <StudyThemeAssets theme={getTheme(theme)} />
        <header className="rf-top">
          <Link href="/ux/focused">← Focused studies</Link>
          <span className="type-eyebrow">October 2026 · exploratory</span>
        </header>
        <div className="rf-main">
          <div className="rf-intro">
            <p className="type-eyebrow">A specific task, a specific change</p>
            <h1 className="type-hero">{study.title}</h1>
            <p>{study.question}</p>
          </div>
          <div className="fc-evidence">
            <strong className="type-item">Why this is here</strong>
            <p>{study.evidence}</p>
            <a
              href={`https://github.com/jerryliu3/goalmaxxing/blob/${BASELINE_COMMIT}/${study.source}`}
              target="_blank"
              rel="noreferrer"
            >
              Source baseline · {BASELINE_COMMIT} ↗
            </a>
          </div>
          <div className="rf-toolbar mt-6">
            <nav className="rf-variants" aria-label="Design alternatives">
              {study.variants.map((item, i) => (
                <Link
                  key={item.name}
                  prefetch={false}
                  aria-current={i === variant ? "page" : undefined}
                  href={`/ux/focused/${study.slug}${i ? "?variant=b" : ""}`}
                >
                  {String.fromCharCode(65 + i)} · {item.name}
                </Link>
              ))}
            </nav>
            <div>
              <Action
                variant="outline"
                aria-pressed={compare}
                onClick={() => setCompare(!compare)}
              >
                Compare baseline
              </Action>
              <Action
                variant="outline"
                aria-pressed={phone}
                onClick={() => setPhone(!phone)}
              >
                Phone width
              </Action>
              <Action
                variant="ghost"
                onClick={() => setRevision((value) => value + 1)}
              >
                Reset sample
              </Action>
              <label className="sr-only" htmlFor="focused-theme">
                Preview theme
              </label>
              <select
                id="focused-theme"
                className="rf-select"
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
            </div>
          </div>
          <div className="fc-change">
            <p>
              <strong>Exact change:</strong> {selected.change}
            </p>
            <p>
              <strong>Tradeoff:</strong> {selected.tradeoff}
            </p>
            <p>
              <strong>Try:</strong> {study.task}
            </p>
          </div>
          <p className="fc-muted mb-5">
            Fictional October 8 sample. All actions stay in memory. Baseline
            panels reconstruct the relevant current source with the same sample;
            they are not screenshots. Phone width changes the canvas; dialogs
            use your browser viewport.
          </p>
          <div
            className="fc-comparison"
            data-compare={compare}
            data-phone={phone}
          >
            {compare && (
              <section>
                <p className="fc-comparison-label type-eyebrow">
                  Current structure · source reconstruction
                </p>
                <div className="fc-demo">
                  <Baseline slug={study.slug} />
                </div>
              </section>
            )}
            <section>
              <p className="fc-comparison-label type-eyebrow">
                Proposal {String.fromCharCode(65 + variant)} · {selected.name}
              </p>
              <div className="fc-demo">
                <Proposal
                  slug={study.slug}
                  key={`${study.slug}-${variant}-${revision}`}
                  variant={variant}
                />
              </div>
            </section>
          </div>
          <p className="fc-boundary">
            Study only. No invitations, messages, preferences, completions, or
            planning changes are sent to your account. Production adoption must
            use the existing ownership, privacy, completion and planner paths.
          </p>
        </div>
      </main>
    </PreviewTheme.Provider>
  );
}
