import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GAZETTEER } from "@/lib/brand/gazetteer";
import { type CreationFlowSummary, GOAL_CREATION_CONCEPTS, TODAY_FLOW, WHAT_CHANGES } from "./model";

const COLUMNS: { key: keyof Omit<CreationFlowSummary, "name">; label: string }[] = [
  { key: "steps", label: "Steps" },
  { key: "decisions", label: "Decisions" },
  { key: "reward", label: "Where the reward appears" },
  { key: "locked", label: "What’s locked" },
  { key: "review", label: "Review" },
];

export function GoalCreationIndex() {
  const rows: (CreationFlowSummary & { letter?: string })[] = [TODAY_FLOW, ...GOAL_CREATION_CONCEPTS];
  return (
    <main className="min-h-dvh text-[#241c14]" style={{ background: GAZETTEER.page }}>
      <section className="px-5 pb-10 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: GAZETTEER.rule }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Goalmaxxing / Goal creation study</p>
            <div className="flex gap-4">
              <Link href="/ux/identity-edit" className="text-xs font-semibold" style={{ color: GAZETTEER.mutedDeep }}>
                Goal editing study
              </Link>
              <Link href="/ux" className="text-xs font-semibold" style={{ color: GAZETTEER.mutedDeep }}>
                UX labs
              </Link>
            </div>
          </div>
          <h1 className="mt-10 max-w-4xl font-display text-[clamp(2.4rem,7vw,5rem)] font-semibold leading-[0.92] tracking-tight">
            Make the card, not the form.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
            Editing a goal now happens on its card. These three flows create one the same way — the production card, callouts,
            direct controls and card back — and each finds a different moment for the reward.
          </p>
          <p className="mt-4 text-sm" style={{ color: GAZETTEER.muted }}>
            Study only. Every draft is local; “Create” ends in a summary and writes nothing.
          </p>
        </div>
      </section>

      <section className="border-t px-5 py-10 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
        <div className="mx-auto max-w-6xl">
          <ul className="grid gap-4 md:grid-cols-3">
            {GOAL_CREATION_CONCEPTS.map((concept) => (
              <li key={concept.slug}>
                <Link
                  href={`/ux/goal-creation/${concept.slug}`}
                  aria-label={`Open ${concept.name}`}
                  className="group flex h-full flex-col rounded-[14px] border p-5 transition hover:border-[#9a4f2c]/60"
                  style={{ borderColor: GAZETTEER.rule, background: GAZETTEER.paper }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: GAZETTEER.muted }}>
                    {concept.letter} · {concept.steps}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{concept.name}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
                    {concept.thesis}
                  </p>
                  <p className="mt-3 text-[11px] leading-snug" style={{ color: GAZETTEER.muted }}>
                    {concept.moments.join(" → ")}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
                    Open
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t px-5 py-10 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Side by side</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: GAZETTEER.rule }}>
                  <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GAZETTEER.muted }}>
                    Flow
                  </th>
                  {COLUMNS.map((column) => (
                    <th key={column.key} className="py-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GAZETTEER.muted }}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name} className="border-b align-top" style={{ borderColor: GAZETTEER.rule }}>
                    <th scope="row" className="py-3 pr-4 font-semibold">
                      {row.letter ? `${row.letter} · ` : ""}
                      {row.name}
                    </th>
                    {COLUMNS.map((column) => (
                      <td key={column.key} className="py-3 pr-4 leading-snug" style={{ color: GAZETTEER.mutedDeep }}>
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t px-5 pb-16 pt-10 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight">What changes vs today</h2>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: GAZETTEER.muted }}>
            Today: Start → Intention → Rhythm → Schedule → Review, about ten decisions beside a passive preview, controls unlike the
            edit card’s, and no question about why it matters or the reward.
          </p>
          <ul className="mt-5 grid max-w-3xl gap-2 text-sm leading-relaxed">
            {WHAT_CHANGES.map((change) => (
              <li key={change} className="border-l-2 pl-3" style={{ borderColor: "#9a4f2c" }}>
                {change}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
