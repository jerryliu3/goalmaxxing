import type { CSSProperties } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

// Keyed by year so a book keeps its cloth on the shelf, in the reader, and in
// the completion ceremony, and does not change color as newer years arrive.
// Index = year % 4, ordered so 2026 stays green and 2025 stays brown.
const CLOTH_BY_YEAR = ["#704d50", "#785a3a", "#344f45", "#4d5266"];

/** The shelf, reader, and ceremony share the same cover, color, and proportions. */
export function FolioBook({ folio }: { folio: GoalFolio }) {
  const cloth = CLOTH_BY_YEAR[Number(folio.year) % CLOTH_BY_YEAR.length];
  return (
    <span className={styles.book} data-folio-book="" style={{ "--folio-cloth": cloth } as CSSProperties}>
      <span className={styles.pageEdges} aria-hidden="true" />
      <span className={styles.spine} aria-hidden="true">GOALMAXXING · {folio.year}</span>
      <span className={styles.cover}>
        <span className={styles.coverTop}>YEAR IN GOALS <ArrowUpRight size={17} aria-hidden="true" /></span>
        <span className={styles.coverYear}>{folio.year}</span>
        <span className={styles.coverRule} aria-hidden="true" />
        <span className={styles.coverTitle}>A year of<br />showing up.</span>
        <span className={styles.coverFooter}><BookOpen size={20} strokeWidth={1.3} aria-hidden="true" /><span>{folio.entries.length} {folio.entries.length === 1 ? "goal" : "goals"}<br />{folio.completions.toLocaleString()} completions</span></span>
      </span>
    </span>
  );
}
