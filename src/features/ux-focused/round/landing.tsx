"use client";
import { useReducer, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, Check } from "lucide-react";
import { Action } from "../common";
import {
  initialLesson,
  LANDING_STORIES,
  lessonReducer,
  lessonSessions,
} from "./landing-model";
import {
  CoachProof,
  LessonGoal,
  LessonMove,
  LessonPlan,
  TargetChoice,
} from "./landing-lesson";
import {
  HorizonProof,
  LandingActions,
  LandingDetails,
  LandingFooter,
  PartnershipProof,
} from "./landing-support";
export function LandingRound({ variant }: { variant: number }) {
  const [state, dispatch] = useReducer(lessonReducer, initialLesson());
  const [step, setStep] = useState<"Shape" | "Adapt" | "Record">("Shape");
  const story = LANDING_STORIES.find((s) => s.id === state.story)!;
  return (
    <div className="fc-product rd-landing" data-direction={variant}>
      <header className="rd-marketing-nav">
        <span className="type-wordmark">Goalmaxxing</span>
        <Action variant="outline" asChild>
          <Link href="/signup">Get started</Link>
        </Action>
      </header>
      {variant === 0 ? (
        <>
          <section className="rd-editorial-hero">
            <p className="type-eyebrow">Make room for what matters</p>
            <h2 className="type-hero">
              A goal you care about.
              <br />A plan you can change.
            </h2>
            <p>
              Turn an intention into placed work. See your progress, and adjust
              when life moves around.
            </p>
            <LandingActions />
            <LessonGoal state={state} />
            <p className="rd-muted">
              An example goal, shown at the size it deserves.
            </p>
          </section>
          <Chapter
            number="01"
            title="Give your intention a shape."
            copy="For this running goal, choose an October target. You can use a different rhythm or deadline for a different kind of goal."
          >
            <TargetChoice state={state} onAction={dispatch} />
          </Chapter>
          <Chapter
            number="02"
            title="Keep the whole month in view."
            copy="Zoom out to see the horizon. Select a day when you need the details."
          >
            <HorizonProof state={state} />
          </Chapter>
          <Chapter
            number="03"
            title="Thursday changed. The goal stayed."
            copy="Move one session, review its new date, and save when the change works for you."
          >
            <LessonPlan state={state} onAction={dispatch} />
            <LessonMove state={state} onAction={dispatch} />
          </Chapter>
          <Chapter
            number="04"
            title="See the work you actually did."
            copy="Hold a completion control to record a past or present session. Future sessions remain planned."
          >
            <LessonPlan state={state} onAction={dispatch} canRecord />
            <div className="rd-record-receipt">
              <Check size={20} />
              <p className="type-item">
                {lessonSessions(state).filter((s) => s.done).length} recorded
                sessions on this goal.
              </p>
            </div>
            <LessonGoal state={state} />
          </Chapter>
          <PartnershipProof />
          <CoachProof state={state} onAction={dispatch} />
        </>
      ) : variant === 1 ? (
        <>
          <section className="rd-lesson-hero">
            <p className="type-eyebrow">A focused system for real goals</p>
            <h2 className="type-hero">
              Make a plan
              <br />
              you can actually use.
            </h2>
            <p>
              A goal, a workable month, and room to adjust. Try the core loop
              before you create an account.
            </p>
            <LandingActions />
          </section>
          <section className="rd-guided-lesson">
            <header>
              <p className="type-eyebrow">Try the product idea</p>
              <h3 className="type-title">Three small moves.</h3>
              <p className="rd-muted">
                Explore in any order. This example is ready to read even if you
                never touch a control.
              </p>
            </header>
            <div className="rd-scopes" role="group" aria-label="Product lesson">
              {(["Shape", "Adapt", "Record"] as const).map((name, i) => (
                <button
                  key={name}
                  aria-pressed={step === name}
                  onClick={() => setStep(name)}
                >
                  {i + 1}. {name}
                </button>
              ))}
            </div>
            {step === "Shape" ? (
              <>
                <LessonGoal state={state} />
                <TargetChoice state={state} onAction={dispatch} />
                <LessonPlan state={state} onAction={dispatch} />
                <Action variant="outline" onClick={() => setStep("Adapt")}>
                  Next: make room for Friday
                </Action>
              </>
            ) : step === "Adapt" ? (
              <>
                <CoachProof state={state} onAction={dispatch} />
                <LessonPlan state={state} onAction={dispatch} />
                <LessonMove state={state} onAction={dispatch} />
                <Action variant="ghost" onClick={() => setStep("Record")}>
                  Next: see recorded progress
                </Action>
              </>
            ) : (
              <>
                <p className="rd-muted">
                  Hold a past or present session to record or undo it. Future
                  sessions stay planned.
                </p>
                <LessonPlan state={state} onAction={dispatch} canRecord />
                <LessonGoal state={state} />
                <Action variant="ghost" onClick={() => setStep("Shape")}>
                  Back to the goal
                </Action>
              </>
            )}
          </section>
          <HorizonProof state={state} />
          <PartnershipProof />
        </>
      ) : (
        <>
          <section className="rd-chooser-hero">
            <p className="type-eyebrow">Goals beyond habits</p>
            <h2 className="type-hero">
              What are you
              <br />
              making room for?
            </h2>
            <p>
              A regular rhythm, a finished project, or something shared. Start
              with the story that feels like yours.
            </p>
            <LandingActions />
          </section>
          <div
            className="rd-story-choices"
            role="group"
            aria-label="Choose a goal story"
          >
            {LANDING_STORIES.map((s) => (
              <button
                key={s.id}
                aria-pressed={state.story === s.id}
                onClick={() => dispatch({ type: "story", story: s.id })}
              >
                <span className="type-item">{s.label}</span>
                <small>
                  {s.id === "rhythm"
                    ? "A comfortable 10K"
                    : s.id === "project"
                      ? "Finish a short film"
                      : "Make a film with a partner"}
                </small>
                <ArrowDown size={17} />
              </button>
            ))}
          </div>
          <section className="rd-chosen-story" aria-label="Selected goal story">
            <header>
              <p className="type-eyebrow">{story.label}</p>
              <h3 className="type-title">{story.title}</h3>
              <p>{story.detail}</p>
            </header>
            <div className="rd-chosen-art">
              <LessonGoal state={state} />
              <div>
                <p className="type-heading">{story.question}</p>
                <TargetChoice state={state} onAction={dispatch} />
              </div>
            </div>
            <LessonPlan state={state} onAction={dispatch} canRecord />
            <p className="rd-muted mt-3">
              Your sessions can be recorded when their date arrives. A partner’s
              sessions are read only.
            </p>
            <LessonMove state={state} onAction={dispatch} />
          </section>
          <HorizonProof state={state} />
          {state.story === "together" ? (
            <PartnershipProof />
          ) : (
            <CoachProof state={state} onAction={dispatch} />
          )}
          <section className="rd-secondary-path">
            <h3 className="type-heading">
              Same system. A different intention.
            </h3>
            <p>
              Each story keeps the same loop: define a goal, place the work,
              record progress, and revise the plan.
            </p>
            <Action
              variant="outline"
              onClick={() =>
                dispatch({
                  type: "story",
                  story: state.story === "rhythm" ? "project" : "rhythm",
                })
              }
            >
              Try another goal story
            </Action>
          </section>
        </>
      )}
      <LandingDetails />
      <LandingFooter />
    </div>
  );
}
function Chapter({
  number,
  title,
  copy,
  children,
}: {
  number: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section className="rd-landing-chapter">
      <header>
        <p className="type-eyebrow">{number} / How it works</p>
        <h3 className="type-title">{title}</h3>
        <p>{copy}</p>
      </header>
      <div>{children}</div>
    </section>
  );
}
