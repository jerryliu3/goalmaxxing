"use client";

import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { createDefaultGoalCreationFields } from "@/features/goals/goal-creation-model";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/features/today/goal-form";
import { BulkGoalForm } from "@/features/today/bulk-goal-form";
import { TrainingPlanImportEntry } from "./training-plan-import-entry";
import {
  TempoMethodContext,
  TempoStepNavigation,
} from "./tempo-step-navigation";
import { STARTER_PACKS } from "./starter-packs";
import "./tempo-goal-creation.css";

type CreationMode = "single" | "multi" | "training";

export function GoalCreationEntry({ onExit }: { onExit?: () => void }) {
  const searchParams = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "multi"
      ? "multi"
      : searchParams.get("mode") === "training" &&
          process.env.NODE_ENV !== "production"
        ? "training"
        : null;
  const [mode, setMode] = useState<CreationMode | null>(initialMode);
  const [selection, setSelection] = useState<CreationMode | null>(initialMode);
  const [choosing, setChoosing] = useState(initialMode === null);
  return (
    <TempoMethodContext.Provider value={() => setChoosing(true)}>
      <div className="mx-auto h-full min-h-0 w-full max-w-5xl">
        {choosing && (
          <div className="tempo-creation">
            <TempoStepNavigation step={0} />
            <div className="tempo-creation-body">
              <div className="tempo-workspace">
                <p className="tempo-eyebrow">
                  A little intention goes a long way
                </p>
                <h2 className="tempo-heading">
                  How do you want
                  <br />
                  to begin?
                </h2>
                <div
                  className="tempo-methods"
                  role="group"
                  aria-label="Creation method"
                >
                <button
                  type="button"
                  aria-pressed={selection === "single"}
                  onClick={() => setSelection("single")}
                >
                  <span aria-hidden="true">↗</span>
                  <strong>A single goal</strong>
                  <small>I know what I want to work on.</small>
                </button>
                <button
                  type="button"
                  aria-pressed={selection === "multi"}
                  onClick={() => setSelection("multi")}
                >
                  <span aria-hidden="true">✧</span>
                  <strong>Shape it with AI</strong>
                  <small>Turn an idea into one goal—or a few.</small>
                </button>
                </div>
                <details className="mt-6 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">
                    Start from a pack or import
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {STARTER_PACKS.map((pack) => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("mode", "multi");
                      params.set("starterPack", pack.key);
                      return (
                        <Link
                          key={pack.key}
                          href={`?${params.toString()}`}
                          replace
                          onClick={() => {
                            setMode("multi");
                            setChoosing(false);
                          }}
                        >
                          {pack.label} starter pack
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("multi");
                        setChoosing(false);
                      }}
                    >
                      CSV / spreadsheet
                    </button>
                    {process.env.NODE_ENV !== "production" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("training");
                          setChoosing(false);
                        }}
                      >
                        Training plan
                      </button>
                    )}
                  </div>
                </details>
              </div>
              <div className="tempo-preview">
                <TempoGoalCard
                  fields={createDefaultGoalCreationFields()}
                  visibility={{
                    category: false,
                    rhythm: false,
                    interval: false,
                    count: false,
                    schedule: false,
                    difficulty: false,
                  }}
                />
              </div>
            </div>
            <div className="tempo-creation-actions">
              <div className="tempo-footer">
                <button
                  type="button"
                  disabled={!selection}
                  onClick={() => {
                    setMode(selection);
                    setChoosing(false);
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}
        <div hidden={choosing} className="h-full min-h-0">
          {mode === "single" ? (
            <GoalForm showBackButton={false} onExit={onExit} />
          ) : mode === "multi" ? (
            <BulkGoalForm showBackButton={false} onExit={onExit} />
          ) : mode === "training" ? (
            <TrainingPlanImportEntry onExit={onExit} />
          ) : null}
        </div>
      </div>
    </TempoMethodContext.Provider>
  );
}
