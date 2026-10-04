"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import { ReviewPreview } from "./review-preview";
import { FragmentPlaque } from "./fragment-plaque";
import { EarnedCeremony, type FlightOrigin } from "./earned-ceremony";
import { studyFields } from "./study-model";
import styles from "./plaque-motion.module.css";

export function PlaqueMotionStudy({ share = false }: { share?: boolean }) {
  const [scene, setScene] = useState<"review" | "earned">("review");
  const [target, setTarget] = useState(12);
  const [difficulty, setDifficulty] = useState<GoalCreationFields["difficulty"]>("hard");
  const [reward, setReward] = useState("A weekend away");
  const [grand, setGrand] = useState(true);
  const [still, setStill] = useState(false);
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);
  const source = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const osReducedMotion = Boolean(useReducedMotion());
  const reduceMotion = osReducedMotion || still;
  const fields = studyFields(target, difficulty);
  const close = () => { setOrigin(null); requestAnimationFrame(() => trigger.current?.focus()); };
  return <main className={styles.page}>
    <div className={styles.container}>
      {!share && <Link href="/ux/brand/card-rewards" className={styles.back}>← Card reward studies</Link>}
      <header className={styles.header}>
        <p className={styles.eyebrow}>Motion study / sample data</p>
        <h1>From intention<br />to keepsake.</h1>
        <p>One plaque. Two moments that matter.</p>
      </header>
      <div className={styles.settings}>
        <label>Finish<select value={difficulty} onChange={event => setDifficulty(event.target.value as GoalCreationFields["difficulty"])}>
          <option value="easy">Glass · Easy</option><option value="medium">Alloy · Medium</option><option value="hard">Chromatic · Hard</option>
        </select></label>
        <label>Celebration<select value={grand ? "grand" : "quiet"} onChange={event => setGrand(event.target.value === "grand")}>
          <option value="grand">Grand · Color & fireworks</option><option value="quiet">Quiet · Light & material</option>
        </select></label>
        <label>Personal reward<input value={reward} maxLength={160} onChange={event => setReward(event.target.value)} placeholder="Optional" /></label>
        <label className={styles.still}><input type="checkbox" checked={reduceMotion} disabled={osReducedMotion} onChange={event => setStill(event.target.checked)} />Reduced motion</label>
      </div>
      <nav className={styles.scenes} aria-label="Prototype moment">
        <button type="button" aria-pressed={scene === "review"} onClick={() => setScene("review")}>01 / The promise</button>
        <button type="button" aria-pressed={scene === "earned"} onClick={() => setScene("earned")}>02 / The keepsake</button>
      </nav>
      {scene === "review" ? <ReviewPreview fields={fields} target={target} onTargetChange={setTarget} still={reduceMotion} onContinue={() => setScene("earned")} />
        : <section className={styles.review} aria-label="Final completion prototype">
          <div className={styles.reviewCopy}>
            <p className={styles.eyebrow}>One more. Then it’s yours.</p>
            <h2>Bring it<br />all together.</h2>
            <p>{target - 1} of {target} completions. The final piece is waiting.</p>
            <DialogPrimitive.Root open={origin !== null} onOpenChange={open => { if (!open) close(); }}>
              <Button ref={trigger} onClick={() => {
                const rect = source.current?.getBoundingClientRect();
                if (rect) setOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
              }}>Complete the final one</Button>
              {origin && <EarnedCeremony fields={fields} target={target} reward={reward} still={reduceMotion} grand={grand} origin={origin} onClose={close} />}
            </DialogPrimitive.Root>
          </div>
          <div className={styles.reviewStage}><div ref={source} style={{ visibility: origin ? "hidden" : "visible" }}>
            <FragmentPlaque fields={fields} target={target} phase="almost" still={reduceMotion} />
          </div><p className={styles.caption}>One piece away from whole.</p></div>
        </section>}
      <details className={styles.notes}>
        <summary>Scope & production decisions</summary>
        <p>This is a finite goal with a total-completion target. The count is both its goal target and its piece count. Nothing here saves a goal or grants a reward.</p>
        <p>PR #963’s editable plaque target is preview-only. Production needs a saved, canonical earning target before this can promise an unlock. Recurring goals currently count successful periods; earning their plaque must not silently end the goal or archive it.</p>
        <p>The existing card partitioner is exact through 24 pieces; this study keeps #963’s 1–20 range. One completion means one piece, not one crack. At one, the whole face is the single piece.</p>
        <p>Grand and Quiet share timing and structure. Reduced motion skips travel and particles while preserving the reward message and book confirmation. The book action is a presentation of an earned result; it must never be what saves the completion.</p>
      </details>
    </div>
  </main>;
}
