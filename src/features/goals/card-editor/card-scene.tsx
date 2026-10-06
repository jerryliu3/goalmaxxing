"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * A card and its card-sized back sharing one flip. Without a back it is just the front.
 * `forward` turns back to the face by continuing the same rotation instead of reversing it.
 */
export function CardScene({
  front,
  back,
  flipped = false,
  forward = false,
  color,
}: {
  front: ReactNode;
  back?: ReactNode;
  flipped?: boolean;
  forward?: boolean;
  color: string;
}) {
  return (
    <div className="card-scene" data-back={flipped} data-forward={forward || undefined} style={{ "--goal-color": color } as CSSProperties}>
      <div className="card-side card-front" aria-hidden={flipped} inert={flipped}>
        {front}
      </div>
      {back ? (
        <div className="card-side card-reverse" aria-hidden={!flipped} inert={!flipped}>
          {back}
        </div>
      ) : null}
    </div>
  );
}
