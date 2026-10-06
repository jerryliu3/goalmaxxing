"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { FONT_VARIABLE_CLASSES } from "@/lib/brand/fonts";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={FONT_VARIABLE_CLASSES}>
      <body className="flex min-h-full flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
        <h1 className="type-title text-xl">Something went wrong</h1>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or reload the page.
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
