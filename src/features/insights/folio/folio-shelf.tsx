"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { FolioBook } from "./folio-book";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FolioReader } from "./folio-reader";
import { folioKey, folioLabel, type GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

function dialogBox() {
  const mobile = window.innerWidth <= 640;
  return {
    width: mobile ? window.innerWidth - 16 : Math.min(1060, window.innerWidth - 32),
    height: mobile ? Math.min(680, window.innerHeight - 16) : Math.min(760, window.innerHeight - 32),
  };
}

function measureOrigin(book: HTMLElement, dialog?: HTMLElement | null) {
  const rect = book.getBoundingClientRect();
  const box = dialog?.getBoundingClientRect();
  const fallback = dialogBox();
  const width = box && box.width > 1 ? box.width : fallback.width;
  const height = box && box.height > 1 ? box.height : fallback.height;
  return {
    x: rect.left + rect.width / 2 - window.innerWidth / 2,
    y: rect.top + rect.height / 2 - window.innerHeight / 2,
    width: book.offsetWidth,
    height: book.offsetHeight,
    transform: getComputedStyle(book).transform,
    revealSx: book.offsetWidth / Math.max(1, width),
    revealSy: book.offsetHeight / Math.max(1, height),
  };
}

/** `compact` sizes the books for a long shelf of month books. */
export function FolioShelf({ folios, compact = false, onDetails }: {
  folios: GoalFolio[];
  compact?: boolean;
  onDetails?: (goalId: string) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<"enter" | "open" | "leave">("open");
  const [origin, setOrigin] = useState({ x: 0, y: 0, width: 296, height: 395, transform: "none", revealSx: 0.28, revealSy: 0.52 });
  const reduceMotion = useReducedMotion();
  const entering = Boolean(openKey) && phase === "enter" && !reduceMotion;
  const leaving = Boolean(openKey) && phase === "leave" && !reduceMotion;
  const inFlight = entering || leaving;
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const selected = folios.find(folio => folioKey(folio) === openKey);
  const flightStyle = {
    "--flight-x": `${origin.x}px`,
    "--flight-y": `${origin.y}px`,
    "--flight-transform": origin.transform,
    width: origin.width,
    height: origin.height,
  } as CSSProperties;

  useLayoutEffect(() => {
    if (!inFlight) return;
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) return;
    const revealSx = origin.width / rect.width;
    const revealSy = origin.height / rect.height;
    if (Math.abs(revealSx - origin.revealSx) < 0.002 && Math.abs(revealSy - origin.revealSy) < 0.002) return;
    setOrigin(current => ({ ...current, revealSx, revealSy }));
  }, [inFlight, origin.height, origin.revealSx, origin.revealSy, origin.width]);

  const closeReader = () => {
    if (!openKey || phase === "leave") return;
    if (reduceMotion || phase === "enter") {
      setOpenKey(null);
      return;
    }
    const book = returnFocus.current?.querySelector<HTMLElement>("[data-folio-book]");
    if (book) setOrigin(measureOrigin(book, dialogRef.current));
    setPhase("leave");
  };

  return (
    <>
      <div className={compact ? `${styles.shelf} ${styles.shelfCompact}` : styles.shelf}>
        {folios.map(folio => (
          <button
            key={folioKey(folio)}
            type="button"
            className={styles.volume}
            data-open={openKey === folioKey(folio)}
            aria-label={`Open ${folioLabel(folio)}, ${folio.entries.length} ${folio.entries.length === 1 ? "goal" : "goals"}`}
            aria-haspopup="dialog"
            onClick={event => {
              if (openKey) return;
              returnFocus.current = event.currentTarget;
              const book = event.currentTarget.querySelector<HTMLElement>("[data-folio-book]");
              if (book) setOrigin(measureOrigin(book));
              setPhase(reduceMotion ? "open" : "enter");
              setOpenKey(folioKey(folio));
            }}
          >
            <FolioBook folio={folio} />
          </button>
        ))}
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) closeReader(); }}>
        <DialogContent
          ref={dialogRef}
          className={styles.readerDialog}
          data-entering={entering}
          data-leaving={leaving}
          style={{
            "--reveal-sx": String(origin.revealSx),
            "--reveal-sy": String(origin.revealSy),
          } as CSSProperties}
          onOpenAutoFocus={event => { if (entering) { event.preventDefault(); dialogRef.current?.focus(); } }}
          overlayClassName={leaving ? `${styles.readerOverlay} ${styles.readerOverlayLeaving}` : styles.readerOverlay}
          onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}
        >
          <DialogTitle className="sr-only">{selected ? folioLabel(selected) : null} past goals</DialogTitle>
          <DialogDescription className="sr-only">Your past goals, in chronological order. Use the previous and next buttons or left and right arrow keys. Drag a goal card to turn it in place. On touch screens, swipe beside the card to change pages. Press Escape to close.</DialogDescription>
          {selected && <>
            {inFlight && <div className={styles.flightStage} data-folio-flight-layer="pages" aria-hidden="true">
              <div className={styles.flyingBook} style={flightStyle}><FolioBook folio={selected} /></div>
            </div>}
            <div className={styles.readerSurface} data-folio-reader="" inert={inFlight}>
              <FolioReader key={folioKey(selected)} folio={selected} onDetails={onDetails} />
            </div>
            {inFlight && <div className={styles.flightStage} data-folio-flight-layer="cover" aria-hidden="true">
              <div
                className={styles.flyingBook}
                data-folio-flight=""
                style={flightStyle}
                onAnimationEnd={event => {
                  if (event.target !== event.currentTarget) return;
                  if (leaving) {
                    setOpenKey(null);
                    return;
                  }
                  setPhase("open");
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
