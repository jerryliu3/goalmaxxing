"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { FolioBook } from "./folio-book";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FolioReader } from "./folio-reader";
import type { GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

const CLOTH_COLORS = ["#344f45", "#785a3a", "#4d5266", "#704d50"];

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

export function FolioShelf({ folios }: { folios: GoalFolio[] }) {
  const [openYear, setOpenYear] = useState<string | null>(null);
  const [phase, setPhase] = useState<"enter" | "open" | "leave">("open");
  const [origin, setOrigin] = useState({ x: 0, y: 0, width: 296, height: 395, transform: "none", revealSx: 0.28, revealSy: 0.52 });
  const reduceMotion = useReducedMotion();
  const entering = Boolean(openYear) && phase === "enter" && !reduceMotion;
  const leaving = Boolean(openYear) && phase === "leave" && !reduceMotion;
  const inFlight = entering || leaving;
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const selected = folios.find(folio => folio.year === openYear);
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
    if (!openYear || phase === "leave") return;
    if (reduceMotion || phase === "enter") {
      setOpenYear(null);
      return;
    }
    const book = returnFocus.current?.querySelector<HTMLElement>("[data-folio-book]");
    if (book) setOrigin(measureOrigin(book, dialogRef.current));
    setPhase("leave");
  };

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
              if (openYear) return;
              returnFocus.current = event.currentTarget;
              const book = event.currentTarget.querySelector<HTMLElement>("[data-folio-book]");
              if (book) setOrigin(measureOrigin(book));
              setPhase(reduceMotion ? "open" : "enter");
              setOpenYear(folio.year);
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
            "--folio-cloth": CLOTH_COLORS[folios.findIndex(folio => folio.year === openYear) % CLOTH_COLORS.length],
            "--reveal-sx": String(origin.revealSx),
            "--reveal-sy": String(origin.revealSy),
          } as CSSProperties}
          onOpenAutoFocus={event => { if (entering) { event.preventDefault(); dialogRef.current?.focus(); } }}
          overlayClassName={leaving ? `${styles.readerOverlay} ${styles.readerOverlayLeaving}` : styles.readerOverlay}
          onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}
        >
          <DialogTitle className="sr-only">{selected?.year} past goals</DialogTitle>
          <DialogDescription className="sr-only">Your past goals, in chronological order. Use the previous and next buttons or left and right arrow keys. Drag a goal card to turn it in place. On touch screens, swipe beside the card to change pages. Press Escape to close.</DialogDescription>
          {selected && <>
            {inFlight && <div className={styles.flightStage} data-folio-flight-layer="pages" aria-hidden="true">
              <div className={styles.flyingBook} style={flightStyle}><FolioBook folio={selected} /></div>
            </div>}
            <div className={styles.readerSurface} data-folio-reader="" inert={inFlight}>
              <FolioReader key={selected.year} folio={selected} />
            </div>
            {inFlight && <div className={styles.flightStage} data-folio-flight-layer="cover" aria-hidden="true">
              <div
                className={styles.flyingBook}
                data-folio-flight=""
                style={flightStyle}
                onAnimationEnd={event => {
                  if (event.target !== event.currentTarget) return;
                  if (leaving) {
                    setOpenYear(null);
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
