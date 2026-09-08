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
            <Link className="text-lg font-semibold underline" href="/ux/concepts">
              Spatial Plan concept gallery
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Authenticated application directions and destination studies.
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
            <Link className="text-lg font-semibold underline" href="/ux/destinations">
              Progress and Community destinations
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Atlas/Pins ledger lock and Club compete lock. Capabilities stay.
            </p>
          </li>
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/achievements">
              Achievements destination study
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Case, Vault, Gallery, Records, Rings, and Showcase hybrid — trophy
              concepts for `/achievements`.
            </p>
          </li>
          <li>
            <Link className="text-lg font-semibold underline" href="/ux/first-principles">
              First-principles interface study
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Orbit, Tide, Relay, Fieldbook — unconstrained interaction systems.
            </p>
          </li>
        </ul>
      </div>
    </main>
  );
}
