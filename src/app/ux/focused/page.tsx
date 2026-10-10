import Link from "next/link";
import { FOCUSED_STUDIES } from "@/features/ux-focused/catalog";
export default function FocusedIndex() {
  return (
    <main className="rf-lab">
      <header className="rf-top">
        <Link href="/ux">← UX labs</Link>
        <span className="type-eyebrow">Focused studies · October 2026</span>
      </header>
      <div className="rf-main">
        <div className="rf-intro">
          <p className="type-eyebrow">Team · Month · Mobile landing</p>
          <h1 className="type-hero">
            Distinct purposes.
            <br />
            Concrete interactions.
          </h1>
          <p>
            Nine new prototypes cover Team, mobile Month, and the mobile landing
            page from main at d33e11e9. Earlier tracker, Profile and goal-search
            studies remain below. Each study names the exact change, shows the
            relevant existing structure, and makes its tradeoff explicit.
            Fictional data; account actions are never sent.
          </p>
        </div>
        <div className="rf-grid">
          {FOCUSED_STUDIES.map((study) => (
            <Link
              className="rf-index-card"
              href={`/ux/focused/${study.slug}`}
              key={study.slug}
            >
              <span className="type-eyebrow">
                {study.variants.length}{" "}
                {study.variants.length === 1 ? "direction" : "alternatives"}
              </span>
              <h2 className="type-heading">{study.title}</h2>
              <p>{study.question}</p>
              <footer>
                {study.variants.map((v) => v.name).join(" / ")} ↗
              </footer>
            </Link>
          ))}
        </div>
        <p className="fc-boundary">
          The previous 24-finding gallery is superseded. Rejected, resolved,
          redundant and deferred findings are excluded from this round.{" "}
          <Link href="/ux/refresh" className="underline">
            Historical first round
          </Link>
        </p>
      </div>
    </main>
  );
}
