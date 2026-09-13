"use client";

import { ArrowUpRight } from "lucide-react";
import "./tempo-ai-creation.css";

export function TempoAiDraftPreview({
  parsing,
  importing,
}: {
  parsing: boolean;
  importing: boolean;
}) {
  return (
    <aside
      className="tempo-ai-preview"
      aria-label="Goal drafts preview"
      data-working={parsing}
    >
      <div className="tempo-ai-deck">
        <div
          className="tempo-ai-paper tempo-ai-paper-back"
          aria-hidden="true"
        />
        <div
          className="tempo-ai-paper tempo-ai-paper-middle"
          aria-hidden="true"
        />
        <div className="tempo-ai-paper tempo-ai-paper-front">
          <div className="tempo-ai-paper-top">
            <span>YOUR NEXT CHAPTER</span>
            <ArrowUpRight size={27} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="tempo-ai-paper-mark" aria-hidden="true">
            {parsing ? (
              <span className="tempo-ai-drafting-dots">
                <i />
                <i />
                <i />
              </span>
            ) : (
              "✧"
            )}
          </div>
          <h3>
            {parsing ? (
              <>
                A little structure.
                <br />A place to start.
              </>
            ) : (
              <>
                One idea.
                <br />
                Room to grow.
              </>
            )}
          </h3>
          <div className="tempo-ai-paper-rule" aria-hidden="true" />
          <p>
            {parsing
              ? "Your drafts are taking shape."
              : importing
                ? "Your list becomes a set of goal cards."
                : "Your ideas become goals you can make your own."}
          </p>
          <div className="tempo-ai-paper-bottom">
            <span>DRAFT → REFINE → BEGIN</span>
            <span aria-hidden="true">↗</span>
          </div>
        </div>
      </div>
      <p className="tempo-ai-preview-caption">
        A card for each goal.
        <br />
        Keep what fits. Make it yours.
      </p>
    </aside>
  );
}
