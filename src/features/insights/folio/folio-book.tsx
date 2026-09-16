import { ArrowUpRight, BookOpen } from "lucide-react";
import type { GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

/** The shelf and opening animation share the same cover, color, and proportions. */
export function FolioBook({ folio }: { folio: GoalFolio }) {
  return (
    <span className={styles.book} data-folio-book="">
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
