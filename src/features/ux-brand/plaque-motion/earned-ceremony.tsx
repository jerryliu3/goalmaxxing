"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { FolioBook } from "@/features/insights/folio/folio-book";
import folioStyles from "@/features/insights/folio/folio.module.css";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import { FragmentPlaque } from "./fragment-plaque";
import { CEREMONY_BEATS, studyFolio, type CeremonyPhase, type PlaquePhase } from "./study-model";
import styles from "./plaque-motion.module.css";

export type FlightOrigin = { left: number; top: number; width: number; height: number };

export function EarnedCeremony({ fields, target, reward, still, grand, origin, onClose }: {
  fields: GoalCreationFields; target: number; reward: string; still: boolean; grand: boolean;
  origin: FlightOrigin; onClose: () => void;
}) {
  const [phase, setPhase] = useState<CeremonyPhase>(still ? "celebrate" : "lift");
  const [flight, setFlight] = useState({ x: 0, y: 0, scale: 1, ready: false });
  const anchor = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const rect = anchor.current?.getBoundingClientRect();
    if (!rect) return;
    setFlight({ x: origin.left + origin.width / 2 - rect.left - rect.width / 2,
      y: origin.top + origin.height / 2 - rect.top - rect.height / 2,
      scale: rect.width ? origin.width / rect.width : 1, ready: true });
  }, [origin]);
  useEffect(() => {
    if (!flight.ready) return;
    if (still && phase !== "celebrate" && phase !== "kept") {
      setPhase(phase === "shelve" ? "kept" : "celebrate");
      return;
    }
    if (!(phase in CEREMONY_BEATS)) return;
    const beat = CEREMONY_BEATS[phase as keyof typeof CEREMONY_BEATS];
    const timer = window.setTimeout(() => setPhase(beat.next), beat.delay);
    return () => window.clearTimeout(timer);
  }, [phase, still, flight.ready]);
  const inBook = phase === "shelve" || phase === "kept";
  // Keep the complete material face visible during the lift. The final piece
  // choreography starts only after the card has arrived in the ceremony.
  const plaquePhase: PlaquePhase = phase === "gather" ? "gather" : "fused";
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className={styles.ceremonyBackdrop} />
    <DialogPrimitive.Content className={styles.ceremony} aria-describedby="ceremony-description"
      data-phase={phase} data-ready={flight.ready} data-still={still} data-grand={grand}
      onCloseAutoFocus={event => event.preventDefault()}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <header className={styles.ceremonyHeader}>
        <p className={styles.eyebrow}>A commitment, kept.</p>
        <DialogPrimitive.Title>{phase === "kept" ? "A chapter worth keeping." : "You made it whole."}</DialogPrimitive.Title>
        <DialogPrimitive.Description id="ceremony-description">
          {phase === "kept" ? "Saved in your 2026 goal book." : `${target} completions. Every one of them yours.`}
        </DialogPrimitive.Description>
      </header>
      <Button className={styles.close} variant="ghost" onClick={onClose}>Close</Button>
      <div className={styles.ceremonyStage}>
        {grand && !still && phase === "celebrate" && <div className={styles.fireworks} aria-hidden="true">
          {[0, 1, 2].map(burst => <span key={burst} className={styles.burst} style={{ "--burst": burst } as CSSProperties}>
            {Array.from({ length: 12 }, (_, ray) => <i key={ray} style={{ "--angle": `${ray * 30}deg` } as CSSProperties} />)}
          </span>)}
        </div>}
        <div ref={anchor} className={styles.heroAnchor}>
          <div className={styles.heroFlight} style={{ "--origin-x": `${flight.x}px`, "--origin-y": `${flight.y}px`, "--origin-scale": flight.scale } as CSSProperties}>
            <FragmentPlaque fields={fields} target={target} phase={plaquePhase} still={still} />
            {phase === "seal" && !still && <div className={styles.sealLight} aria-hidden="true" />}
          </div>
        </div>
        {inBook && <div className={`${styles.bookDock} ${folioStyles.flyingBook}`} style={{ "--folio-cloth": "#4d5266" } as CSSProperties}>
          <div className={styles.bookPages} aria-hidden="true"><span>{fields.title}</span><small>{target} / {target} · Complete</small></div>
          <FolioBook folio={studyFolio(fields)} />
        </div>}
      </div>
      <footer className={styles.ceremonyFooter}>
        <div role="status" aria-live="polite">
          {phase === "celebrate" && <><h3>Congratulations. You earned this.</h3>{reward.trim() && <p>Your reward · {reward.trim()}</p>}</>}
          {phase === "kept" && <p>{fields.title}<br />Part of your story, now.</p>}
          {phase === "shelve" && <p>Finding its place in your book…</p>}
        </div>
        <div className={styles.actions}>
          {phase === "celebrate" ? <Button onClick={() => setPhase(still ? "kept" : "shelve")}>Keep in my book</Button>
            : phase === "kept" ? <Button onClick={onClose}>Back to the study</Button>
            : <Button variant="outline" onClick={() => setPhase(inBook ? "kept" : "celebrate")}>Skip animation</Button>}
        </div>
      </footer>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
