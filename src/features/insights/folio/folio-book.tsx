import type { CSSProperties } from "react";
import { format, parseISO } from "date-fns";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

// Keyed by year so a book keeps its cloth on the shelf, in the reader, and in
// the completion ceremony, and does not change color as newer years arrive.
// Index = year % 4, ordered so 2026 stays green and 2025 stays brown. Month
// books step through the same cloths so neighbouring months differ.
const CLOTH_BY_YEAR = ["#704d50", "#785a3a", "#344f45", "#4d5266"];

function clothFor(folio: GoalFolio) {
  const step = folio.month ? Number(folio.month.slice(5, 7)) : 0;
  return CLOTH_BY_YEAR[(Number(folio.year) + step) % CLOTH_BY_YEAR.length];
}

/** The shelf, reader, and ceremony share the same cover, color, and proportions. */
export function FolioBook({ folio }: { folio: GoalFolio }) {
  const month = folio.month ? parseISO(`${folio.month}-01`) : null;
  const coverName = month ? format(month, "MMMM") : folio.year;
  return (
    <span className={styles.book} data-folio-book="" style={{ "--folio-cloth": clothFor(folio) } as CSSProperties}>
      <span className={styles.pageEdges} aria-hidden="true" />
      <span className={styles.spine} aria-hidden="true">GOALMAXXING · {month ? format(month, "MMMM yyyy").toUpperCase() : folio.year}</span>
      <span className={styles.cover}>
        <span className={styles.coverTop}>{month ? `${folio.year} · MONTH IN GOALS` : "YEAR IN GOALS"} <ArrowUpRight size={17} aria-hidden="true" /></span>
        <span className={styles.coverYear} style={{ "--cover-chars": coverName.length } as CSSProperties}>{coverName}</span>
        <span className={styles.coverRule} aria-hidden="true" />
        <span className={styles.coverTitle}>A {month ? "month" : "year"} of<br />showing up.</span>
        <span className={styles.coverFooter}><BookOpen size={20} strokeWidth={1.3} aria-hidden="true" /><span>{folio.entries.length} {folio.entries.length === 1 ? "goal" : "goals"}<br />{folio.completions.toLocaleString()} completions</span></span>
      </span>
    </span>
  );
}
