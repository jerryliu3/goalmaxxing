"use client";

import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  Info,
  Monitor,
  RotateCcw,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONCEPTS, type Concept, type Destination } from "./model";
import { useStudy } from "./use-study";
import { GoalBuilder } from "./goal-builder";
import { Planner } from "./planners";
import { Progress } from "./progress";
import { Community } from "./community";
import { DetailDialogs } from "./primitives";
import "./study.css";

export function NextWaveStudy() {
  const [concept, setConcept] = useState<Concept>("prism");
  const [destination, setDestination] = useState<Destination>("planner");
  const [mobile, setMobile] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState(false);
  const [compare, setCompare] = useState(false);
  const s = useStudy();
  const current = CONCEPTS.find((c) => c.id === concept)!;
  return (
    <main className="nw">
      <header className="study-toolbar">
        <div className="study-brand">
          <span>
            g<span>↗</span>
          </span>
          <div>
            GOALMAXXING<small>NEXT WAVE / INTERACTION STUDIES</small>
          </div>
        </div>
        <div className="study-controls">
          <span className="study-status">EXPLORATION · 05 CONCEPTS</span>
          <button onClick={() => setCompare(true)}>
            Compare <ArrowUpRight size={14} />
          </button>
          <button
            onClick={() => setNotes(true)}
            aria-label="Read concept notes"
          >
            <Info size={16} />
            <span>Design notes</span>
          </button>
          <div className="viewport-toggle" aria-label="Preview width">
            <button
              aria-pressed={!mobile}
              onClick={() => setMobile(false)}
              aria-label="Full width preview"
            >
              <Monitor size={17} />
            </button>
            <button
              aria-pressed={mobile}
              onClick={() => setMobile(true)}
              aria-label="Mobile width preview"
            >
              <Smartphone size={17} />
            </button>
          </div>
        </div>
      </header>
      <nav className="concept-rail" aria-label="Design concepts">
        {CONCEPTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setConcept(c.id)}
            aria-current={concept === c.id ? "page" : undefined}
          >
            <span>{c.n}</span>
            <strong>{c.name}</strong>
            <span className={`concept-swatch swatch-${c.id}`} />
          </button>
        ))}
      </nav>
      <div className="study-stage">
        <div className={`study-viewport ${mobile ? "mobile-preview" : ""}`}>
          <div className={`app-surface nw-${concept}`}>
            <Tabs
              value={destination}
              onValueChange={(v) => setDestination(v as Destination)}
              className="app-destinations"
            >
              <header className="app-header">
                <div className="app-wordmark">
                  <Compass size={23} />
                  <span>
                    goalmaxxing<span className="wordmark-dot">.</span>
                  </span>
                </div>
                <div className="destination-tabs">
                  <TabsList
                    className="app-nav"
                    aria-label="Application destination"
                  >
                    <TabsTrigger value="planner">
                      <CalendarDays size={17} />
                      <span>Planner</span>
                    </TabsTrigger>
                    <TabsTrigger value="progress">
                      <Activity size={17} />
                      <span>Progress</span>
                    </TabsTrigger>
                    <TabsTrigger value="community">
                      <Users size={17} />
                      <span>Community</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <button
                  className="create-goal-button"
                  onClick={() => setCreating(true)}
                >
                  + Create goal
                </button>
              </header>
              <TabsContent
                value={destination}
                className="app-content"
                key={`${concept}-${destination}`}
              >
                {destination === "planner" ? (
                  <Planner concept={concept} s={s} />
                ) : destination === "progress" ? (
                  <Progress concept={concept} s={s} />
                ) : (
                  <Community concept={concept} s={s} />
                )}
              </TabsContent>
            </Tabs>
            <footer className="app-footer">
              <span role="status" aria-live="polite">
                <Check size={14} />
                {s.notice}
              </span>
              <div>
                {s.previous && (
                  <button onClick={s.undo}>
                    <RotateCcw size={14} />
                    Undo
                  </button>
                )}
                <button onClick={s.reset}>Reset demo</button>
              </div>
            </footer>
          </div>
        </div>
      </div>
      <div className="study-bottom">
        <span>
          <b>
            {current.n} / {current.name}
          </b>{" "}
          {current.tagline}
        </span>
        <button onClick={() => setNotes(true)}>
          Try this interaction <ChevronDown size={14} />
        </button>
      </div>
      <GoalBuilder
        concept={concept}
        open={creating}
        onOpenChange={setCreating}
      />
      <DetailDialogs s={s} concept={concept} />
      <Dialog open={notes} onOpenChange={setNotes}>
        <DialogContent
          className="nw-modal nw-notes"
          overlayClassName="nw-overlay"
          showCloseButton={false}
        >
          <button
            className="modal-close"
            aria-label="Close design notes"
            onClick={() => setNotes(false)}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">DIRECTION {current.n} · DESIGN NOTES</span>
          <DialogTitle className="modal-title">{current.name}</DialogTitle>
          <DialogDescription className="modal-description">
            {current.thesis}
          </DialogDescription>
          <div className="notes-section">
            <h3>Try the moment</h3>
            <p>{current.gesture}</p>
          </div>
          <div className="notes-section">
            <h3>The tradeoff</h3>
            <p>{current.risk}</p>
          </div>
          <div className="notes-section">
            <h3>Borrowed principles</h3>
            <p>{current.references.join(" · ")}</p>
          </div>
          <p className="notes-disclaimer">
            Five separate visual directions share one demo state so changes
            carry between them. Planner edits are reviewable and reversible;
            progress is derived from completions. Team data and challenge
            membership are simulated. This study does not change the existing
            product locks.
          </p>
          <button className="primary" onClick={() => setNotes(false)}>
            Explore {current.name}
            <ArrowUpRight size={18} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={compare} onOpenChange={setCompare}>
        <DialogContent
          className="nw-modal nw-notes nw-comparison"
          overlayClassName="nw-overlay"
          showCloseButton={false}
        >
          <button
            className="modal-close"
            aria-label="Close comparison"
            onClick={() => setCompare(false)}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">FIVE WAYS INTO THE SAME LIFE</span>
          <DialogTitle className="modal-title">
            Choose a feeling.
            <br />
            Test the behavior.
          </DialogTitle>
          <DialogDescription className="modal-description">
            Start with Planner. Finish a session, move one, then inspect
            Progress. Every direction keeps the same data.
          </DialogDescription>
          <div className="comparison-options">
            {CONCEPTS.map((c) => (
              <button
                className={`comparison-option comparison-${c.id}`}
                key={c.id}
                onClick={() => {
                  setConcept(c.id);
                  setDestination("planner");
                  setCompare(false);
                }}
              >
                <span>{c.n}</span>
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.thesis}</p>
                </div>
                <ArrowUpRight size={23} />
              </button>
            ))}
          </div>
          <p className="notes-disclaimer">
            Initial recommendation: Tempo for the clearest product improvement;
            Prism for the strongest sensory direction; Weave for planning depth.
            Mosaic and Script test more expressive alternatives.
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
