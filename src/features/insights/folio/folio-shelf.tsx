"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { FolioBook } from "./folio-book";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FolioReader } from "./folio-reader";
import type { GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

const CLOTH_COLORS = ["#344f45", "#785a3a", "#4d5266", "#704d50"];

export function FolioShelf({ folios }: { folios: GoalFolio[] }) {
  const [openYear, setOpenYear] = useState<string | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0, width: 296, height: 395, transform: "none" });
  const [arrived, setArrived] = useState(false);
  const reduceMotion = useReducedMotion();
  const entering = !arrived && !reduceMotion;
  const dialogRef = useRef<HTMLDivElement>(null);
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
            data-open={openYear === folio.year}
            style={{ "--folio-cloth": CLOTH_COLORS[index % CLOTH_COLORS.length] } as CSSProperties}
            aria-label={`Open ${folio.year}, ${folio.entries.length} ${folio.entries.length === 1 ? "goal" : "goals"}`}
            aria-haspopup="dialog"
            onClick={event => {
              returnFocus.current = event.currentTarget;
              const book = event.currentTarget.querySelector<HTMLElement>("[data-folio-book]");
              if (book) {
                const rect = book.getBoundingClientRect();
                setOrigin({ x: rect.left + rect.width / 2 - window.innerWidth / 2, y: rect.top + rect.height / 2 - window.innerHeight / 2, width: book.offsetWidth, height: book.offsetHeight, transform: getComputedStyle(book).transform });
              }
              setArrived(false);
              setOpenYear(folio.year);
            }}
          >
            <FolioBook folio={folio} />
          </button>
        ))}
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setOpenYear(null); }}>
        <DialogContent
          ref={dialogRef}
          className={styles.readerDialog}
          data-entering={entering}
          style={{ "--folio-cloth": CLOTH_COLORS[folios.findIndex(folio => folio.year === openYear) % CLOTH_COLORS.length] } as CSSProperties}
          onOpenAutoFocus={event => { if (entering) { event.preventDefault(); dialogRef.current?.focus(); } }}
          overlayClassName={styles.readerOverlay}
          onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}
        >
          <DialogTitle className="sr-only">{selected?.year} past goals</DialogTitle>
          <DialogDescription className="sr-only">Your past goals, in chronological order. Use the previous and next buttons or left and right arrow keys. On touch screens, swipe a card. Press Escape to close.</DialogDescription>
          {selected && <>
            <div className={styles.readerSurface} inert={entering}>
              <FolioReader key={selected.year} folio={selected} />
            </div>
            {entering && <div className={styles.flightStage} aria-hidden="true">
              <div
                className={styles.flyingBook}
                data-folio-flight=""
                style={{ "--flight-x": `${origin.x}px`, "--flight-y": `${origin.y}px`, "--flight-transform": origin.transform, width: origin.width, height: origin.height } as CSSProperties}
                onAnimationEnd={event => {
                  if (event.target !== event.currentTarget) return;
                  setArrived(true);
                  if (document.activeElement === dialogRef.current) {
                    // Wait for React to remove inert before moving focus into the reader.
                    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLButtonElement>("section button:not(:disabled)")?.focus());
                  }
                }}
              ><FolioBook folio={selected} /></div>
            </div>}
          </>}
        </DialogContent>
      </Dialog>
    </>
  );
}
