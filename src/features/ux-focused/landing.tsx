import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Action } from "./common";

function BaselineLandingActions() {
  return (
    <div className="rf-actions mt-6">
      <Action asChild>
        <Link href="/calendar">
          Go to app <ArrowRight size={16} />
        </Link>
      </Action>
      <Action variant="outline" asChild>
        <Link href="/demo">Try demo</Link>
      </Action>
    </div>
  );
}
export function LandingBaseline() {
  return (
    <div className="fc-product fc-marketing">
      <p className="type-wordmark">Goalmaxxing</p>
      <h2 className="type-hero mt-8">
        Achieve your goals using one focused system
      </h2>
      <p className="my-5">
        Deeply customizable goals beyond basic habits. Fully adjustable sessions
        for when plans and priorities change.
      </p>
      <BaselineLandingActions />
      <div className="fc-mini-browser mt-8">
        <div className="fc-between">
          <strong className="type-item">Your plan</strong>
          <span className="fc-muted">Month · Solo</span>
        </div>
        <div className="fc-dense-proof">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i}>
              <small>{i < 31 ? i + 1 : ""}</small>
              {[4, 6, 7].includes(i) && (
                <span>{i === 6 ? "Tempo run" : "Easy run"}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="fc-muted mt-4">
        Reconstruction of the hero&apos;s overview-first proof, using the same
        running goal as the proposal.
      </p>
    </div>
  );
}
