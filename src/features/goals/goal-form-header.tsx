"use client";

import { ArrowLeft, CircleAlert, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

export function GoalFormHeader({
  isEditing,
  isPlannerTask,
  saving,
  hasRecovery,
  showBackButton,
  exitHref,
  validationError,
  submitDisabled,
  goalFormId,
  modeSwitchControl,
  onBack,
}: {
  isEditing: boolean;
  isPlannerTask: boolean;
  saving: boolean;
  hasRecovery: boolean;
  showBackButton: boolean;
  exitHref: string;
  validationError: string | null;
  submitDisabled: boolean;
  goalFormId: string;
  modeSwitchControl?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{isEditing ? "Edit goal" : "New goal"}</CardTitle>
          {modeSwitchControl}
        </div>
        <div className="flex items-center gap-2">
          {showBackButton ? (
            saving || hasRecovery ? (
              <Button type="button" variant="outline" disabled>
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : onBack ? (
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={exitHref}>
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              </Button>
            )
          ) : null}
          <div className="flex items-center gap-0">
            {validationError ? (
              <Tooltip content={validationError} side="bottom" align="end">
                <span
                  className="inline-flex size-9 items-center justify-center text-destructive"
                  title={validationError}
                  tabIndex={0}
                  aria-label={validationError}
                >
                  <CircleAlert className="size-4" />
                  <span className="sr-only">{validationError}</span>
                </span>
              </Tooltip>
            ) : null}
            <Button type="submit" form={goalFormId} disabled={submitDisabled}>
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isEditing ? "Save changes" : isPlannerTask ? "Create task" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}
