import {
  Children,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./solid-lettering.module.css";

// Cadence uses fragments and <br />. Preserve those breaks on every slice.
// Decorative copies use generated content, not duplicate readable DOM text.
function glyphs(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (!isValidElement<{ children?: ReactNode }>(child)) {
        return "";
      }
      return child.type === "br" ? "\n" : glyphs(child.props.children);
    })
    .join("");
}

export type LetteringSize = "display" | "title" | "supporting";

/** Closely spaced slices join the card surface to the raised glyph face.
 * Every slice shares the card's perspective, rather than a projected shadow. */
export function SolidLettering({
  children,
  size = "title",
}: {
  children: ReactNode;
  size?: LetteringSize;
}) {
  const text = glyphs(children);
  if (!text) {
    return children;
  }
  return (
    <span className={styles.solid} data-lettering-solid={size}>
      {Array.from({ length: 16 }, (_, index) => (
        <span
          key={index}
          className={styles.wall}
          aria-hidden="true"
          data-glyphs={text}
          style={{ "--slice": index / 16 } as CSSProperties}
        />
      ))}
      <span className={styles.face} data-lettering-face="">
        {children}
      </span>
    </span>
  );
}

export function renderSolidLettering(children: ReactNode, size: LetteringSize) {
  return <SolidLettering size={size}>{children}</SolidLettering>;
}
