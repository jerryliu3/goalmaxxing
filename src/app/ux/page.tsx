import Link from "next/link";

export default function UxHubPage() {
  return (
    <main className="min-h-dvh bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Unlisted UX labs
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          UX labs
        </h1>
        <ul className="mt-10 space-y-4">
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/goal-view">
              Goal View — Card Rails, Goal Desk and Time Weave
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Real goal cards, editable dates, goal filtering, and two phone
              arrangements. Compare Time Weave in Goal View and the vertical Week agenda.
            </p>
          </li>
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/interface-craft">
              Everyday interface — planner interaction models
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare four ways to operate the planner. Includes the first-round
              completion history, goal detail, and progress summary examples.
            </p>
          </li>
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/brand/plaque-motion">
              Plaque motion — intention to keepsake
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Review sharding, editable outlines, and a final-completion ceremony
              that seals the plaque and places it into the goal book.
            </p>
          </li>
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/motion">
              Motion in context — daily work and earned progress
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Floating linked credit, a weekly quest clasp, task slips, milestone
              flags, and finished goals binding into a yearly volume.
            </p>
          </li>
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/progress-overview">
              Progress — section overview
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Expand the week and achievements in place; open focused history,
              patterns, and the goal library. Concept B, with sample data.
            </p>
          </li>
          <li>
            <Link
              className="text-lg font-semibold underline"
              href="/ux/next-wave"
            >
              Next Wave — five interactive directions
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Prism, Tempo, Weave, Mosaic, Script — planner, progress, and
              community. Includes a mobile preview and comparison notes.
            </p>
          </li>
          <li>
            <Link
              className="text-lg font-semibold underline"
              href="/ux/concepts"
            >
              Spatial Plan concept gallery
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Authenticated application directions, destination studies, and Plan
              craft (goal focus, quieter past days, collapsed completed).
            </p>
          </li>
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/brand">
              Brand, atmospheres, and hue-contrast
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Gazetteer lock, Col runner-up, and later atmosphere rounds.
            </p>
          </li>
          <li>
            <Link
              className="text-lg font-semibold underline"
              href="/ux/destinations"
            >
              Progress and Community destinations
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Atlas/Pins ledger lock and Club compete lock. Capabilities stay.
            </p>
          </li>
          <li>
            <Link
              className="text-lg font-semibold underline"
              href="/ux/achievements"
            >
              Achievements destination study
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Case, Vault, Gallery, Records, Rings, and Showcase hybrid — trophy
              concepts for `/achievements`.
            </p>
          </li>
          <li>
            <Link
              className="text-lg font-semibold underline"
              href="/ux/first-principles"
            >
              First-principles interface study
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Orbit, Tide, Relay, Fieldbook — unconstrained interaction systems.
            </p>
          </li>
          <li>
            <Link
              className="text-lg font-semibold underline"
              href="/ux/day-work"
            >
              Day work — open a goal, or replace the list
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Folio, Phrase, and Peek for the checklist unfold. Deck, Gazette,
              and Stations as other ways to hold today. Includes the live
              form-under-the-row control.
            </p>
          </li>
          <li>
            <Link
              className="text-lg font-semibold underline"
              href="/ux/grow-score"
            >
              Grow score — unbounded revisions
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Pace Line, Lagged Slope, and Grace Decay on top of journeys Grow.
              Linear climb while consistent; exponential decay only when idle;
              absolute day/week/month earn caps.
            </p>
          </li>
        </ul>
      </div>
    </main>
  );
}
