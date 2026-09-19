"use client";

import { type ChangeEvent, type ReactNode, useId, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  FileUp,
  LoaderCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { BulkInputMode } from "@/features/today/bulk-goal-types";
import "@/features/goals/tempo-ai-creation.css";

interface BulkGoalInputCardProps {
  inputMode: BulkInputMode;
  onInputModeChange: (mode: BulkInputMode) => void;
  modeSwitchControl?: ReactNode;
  showBackButton?: boolean;
  onExit?: () => void;
  naturalLanguageInput: string;
  onNaturalLanguageInputChange: (value: string) => void;
  csvInput: string;
  onCsvInputChange: (value: string) => void;
  csvExample: string;
  onUseCsvExample: () => void;
  parsing: boolean;
  onParseNaturalLanguage: () => void;
  onParseCsv: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onParseUploadedFile: () => void;
  uploadedFileName: string | null;
  mobilePreview?: ReactNode;
  disabled?: boolean;
}

const ideas = [
  {
    label: "Move more",
    tone: "health",
    prompt:
      "I want to build a sustainable fitness routine, with a few achievable goals each week.",
  },
  {
    label: "Make something",
    tone: "creative",
    prompt:
      "I want to finish a creative project, with a regular practice and a few meaningful milestones.",
  },
  {
    label: "Find balance",
    tone: "personal",
    prompt:
      "I want to make more time for reading, friends, and rest. Help me start small.",
  },
];

export function BulkGoalInputCard({
  inputMode,
  onInputModeChange,
  modeSwitchControl,
  showBackButton = true,
  onExit,
  naturalLanguageInput,
  onNaturalLanguageInputChange,
  csvInput,
  onCsvInputChange,
  csvExample,
  onUseCsvExample,
  parsing,
  onParseNaturalLanguage,
  onParseCsv,
  onFileChange,
  onParseUploadedFile,
  uploadedFileName,
  mobilePreview,
  disabled = false,
}: BulkGoalInputCardProps) {
  const id = useId();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  const locked = disabled || parsing;
  const importing = inputMode === "csv";
  return (
    <section className="tempo-ai-composer" aria-busy={parsing}>
      <header className="tempo-ai-heading">
        <div className="tempo-ai-eyebrow">
          <span>
            {importing ? "FROM YOUR LIST" : "A LITTLE HELP GETTING STARTED"}
          </span>
          {modeSwitchControl}
          {showBackButton &&
            (onExit ? (
              <button
                type="button"
                aria-label="Close goal creator"
                disabled={locked}
                onClick={onExit}
              >
                <X size={18} />
              </button>
            ) : (
              <Link
                href="/"
                aria-label="Close goal creator"
                aria-disabled={locked}
                onClick={(event) => {
                  if (locked) event.preventDefault();
                }}
              >
                <X size={18} />
              </Link>
            ))}
        </div>
        <h2>
          {importing ? (
            <>
              Bring your goals
              <br />
              with you.
            </>
          ) : (
            <>
              What would you like
              <br />
              to make room for?
            </>
          )}
        </h2>
        <p>
          {importing
            ? "Turn an existing list into cards you can make your own."
            : "A rough idea is enough. We’ll help turn it into a few goals that fit your life."}
        </p>
      </header>
      {mobilePreview && (
        <div className="tempo-ai-mobile-preview">{mobilePreview}</div>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={inputMode}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
        >
          <fieldset className="tempo-ai-fields" disabled={locked}>
            {!importing ? (
              <>
                <div className="tempo-ai-writing">
                  <label htmlFor={id + "-prompt"}>YOUR STARTING POINT</label>
                  <textarea
                    ref={promptRef}
                    id={id + "-prompt"}
                    aria-label="Describe goals in natural language"
                    value={naturalLanguageInput}
                    onChange={(event) =>
                      onNaturalLanguageInputChange(event.target.value)
                    }
                    maxLength={8000}
                    placeholder={
                      "I’d like to get outside more, read a little every week, and finally start that project…"
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        (event.metaKey || event.ctrlKey) &&
                        !event.nativeEvent.isComposing &&
                        naturalLanguageInput.trim() &&
                        !locked
                      ) {
                        event.preventDefault();
                        onParseNaturalLanguage();
                      }
                    }}
                  />
                  <div className="tempo-ai-writing-foot">
                    <span>Think out loud. Details can come later.</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </div>
                </div>
                <div className="tempo-ai-ideas">
                  <span>Need a spark?</span>
                  <div role="group" aria-label="Ideas to get started">
                    {ideas.map((idea) => (
                      <button
                        type="button"
                        key={idea.label}
                        data-tone={idea.tone}
                        onClick={() => {
                          const existing = naturalLanguageInput.trim();
                          onNaturalLanguageInputChange(
                            existing
                              ? existing + "\n\n" + idea.prompt
                              : idea.prompt,
                          );
                          promptRef.current?.focus();
                        }}
                      >
                        <i aria-hidden="true" />
                        {idea.label}
                        <span aria-hidden="true">+</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="tempo-ai-primary"
                  disabled={locked || !naturalLanguageInput.trim()}
                  onClick={onParseNaturalLanguage}
                >
                  <span>
                    {parsing ? "Shaping your goals…" : "Shape my goals"}
                  </span>
                  {parsing ? (
                    <LoaderCircle size={18} className="tempo-ai-spinner" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              </>
            ) : (
              <>
                <input
                  ref={fileRef}
                  id={id + "-file"}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={onFileChange}
                  hidden
                />
                <button
                  type="button"
                  className="tempo-ai-file"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Choose CSV or spreadsheet file"
                >
                  <span className="tempo-ai-file-icon">
                    <FileUp size={23} strokeWidth={1.5} />
                  </span>
                  <strong>{uploadedFileName || "Choose a file"}</strong>
                  <span>
                    {uploadedFileName
                      ? "Choose a different file"
                      : "CSV or Excel spreadsheet"}
                  </span>
                </button>
                {uploadedFileName && (
                  <button
                    type="button"
                    className="tempo-ai-primary"
                    onClick={onParseUploadedFile}
                    disabled={locked}
                  >
                    <span>
                      {parsing
                        ? "Preparing your cards…"
                        : "Preview file as goals"}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                )}
                <details className="tempo-ai-paste">
                  <summary>Or paste a list in CSV format</summary>
                  <label htmlFor={id + "-csv"} className="sr-only">
                    Paste CSV content
                  </label>
                  <textarea
                    id={id + "-csv"}
                    value={csvInput}
                    onChange={(event) => onCsvInputChange(event.target.value)}
                    placeholder={
                      "title,category,frequency_type,recurrence_interval,target_count\nRead,Personal,recurring,weekly,3"
                    }
                  />
                  <button
                    type="button"
                    className="tempo-ai-primary"
                    disabled={locked || !csvInput.trim()}
                    onClick={onParseCsv}
                  >
                    <span>
                      {parsing
                        ? "Preparing your cards…"
                        : "Preview pasted goals"}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                  <details className="tempo-ai-format">
                    <summary>See an example & supported fields</summary>
                    <pre>{csvExample}</pre>
                    <button
                      type="button"
                      className="tempo-ai-text-button"
                      onClick={onUseCsvExample}
                    >
                      Use this example
                    </button>
                    <p>
                      Also supports description, color, target basis, milestone
                      names, dates, and time of day.
                    </p>
                  </details>
                </details>
              </>
            )}
          </fieldset>
        </motion.div>
      </AnimatePresence>
      <p className="tempo-ai-reassurance" role="status">
        {parsing
          ? "Finding a rhythm, a few clear targets, and room to adjust."
          : "You’ll review every goal before anything is saved."}
      </p>
      <div className="tempo-ai-alternative">
        <button
          type="button"
          disabled={locked}
          onClick={() =>
            onInputModeChange(importing ? "natural_language" : "csv")
          }
        >
          {importing ? (
            "Start with an idea instead"
          ) : (
            <>
              <FileUp size={14} />
              Already have a list? Import it
            </>
          )}
        </button>
      </div>
    </section>
  );
}
