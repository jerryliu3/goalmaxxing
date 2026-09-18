import type { CSSProperties } from "react";
import styles from "./card-solid-body.module.css";

// Eight narrow quads per rounded corner join the front to the back. Unlike
// translated card copies, these are connected side surfaces with real depth.
const CORNERS = ["bottomRight", "bottomLeft", "topLeft", "topRight"] as const;
const STEP = Math.PI / 16;

export function CardSolidBody() {
  return (
    <span className={styles.body} aria-hidden="true" data-card-solid="">
      <span className={styles.back}><span className={styles.backMark}>G<span>GOALMAXXING</span></span></span>
      <span className={`${styles.side} ${styles.top}`} />
      <span className={`${styles.side} ${styles.right}`} />
      <span className={`${styles.side} ${styles.bottom}`} />
      <span className={`${styles.side} ${styles.left}`} />
      {CORNERS.map((corner, quadrant) => <span key={corner} className={`${styles.corner} ${styles[corner]}`}>
        {Array.from({ length: 8 }, (_, index) => {
          const angle = quadrant * Math.PI / 2 + (index + 0.5) * STEP;
          // Trig differs in its last bits between the server and the browser, so
          // the facets are rounded to keep server and client markup identical.
          return <span key={index} className={`${styles.side} ${styles.facet}`} style={{
            "--nx": Math.cos(angle).toFixed(6), "--ny": Math.sin(angle).toFixed(6),
            "--cx": (Math.cos(angle) * Math.cos(STEP / 2)).toFixed(6), "--cy": (Math.sin(angle) * Math.cos(STEP / 2)).toFixed(6),
            "--turn": `${(angle * 180 / Math.PI - 90).toFixed(4)}deg`,
          } as CSSProperties} />;
        })}
      </span>)}
    </span>
  );
}
