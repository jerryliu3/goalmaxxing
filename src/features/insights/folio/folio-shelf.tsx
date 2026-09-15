"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FolioReader } from "./folio-reader";
import type { GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

export function FolioShelf({ folios }: { folios: GoalFolio[] }) {
  const [openYear, setOpenYear] = useState<string | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const selected = folios.find(folio => folio.year === openYear);
  return (
    <>
      <div className={styles.shelf}>
        {folios.map((folio, index) => (
          <button
            key={folio.year}
            type="button"
            className={styles.volume}
            style={{ "--folio-cloth": ["#344f45", "#785a3a", "#4d5266", "#704d50"][index % 4] } as CSSProperties}
            aria-label={`Open ${folio.year}, ${folio.entries.length} ${folio.entries.length === 1 ? "goal" : "goals"}`}
            aria-haspopup="dialog"
            onClick={event => {
              returnFocus.current = event.currentTarget;
              setOpenYear(folio.year);
            }}
          >
            <span className={styles.book}>
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
          </button>
        ))}
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setOpenYear(null); }}>
        <DialogContent
          className={styles.readerDialog}
          overlayClassName={styles.readerOverlay}
          onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}
        >
          <DialogTitle className="sr-only">{selected?.year} past goals</DialogTitle>
          <DialogDescription className="sr-only">Your past goals, in chronological order. Use the previous and next buttons or left and right arrow keys. On touch screens, swipe a card. Press Escape to close.</DialogDescription>
          {selected && <FolioReader key={selected.year} folio={selected} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
