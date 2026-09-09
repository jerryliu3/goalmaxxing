"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const BOTTOM_SHEET_FRAME_CLASS =
  "left-0 right-0 top-auto bottom-0 z-[70] grid w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-3xl rounded-b-none border-x-0 border-b-0 border-t bg-background p-0 ring-0 data-open:slide-in-from-bottom-6 data-open:zoom-in-100 data-closed:slide-out-to-bottom-6 data-closed:zoom-out-100 sm:max-w-none md:left-1/2 md:right-auto md:w-[min(100vw-3rem,40rem)] md:max-w-[40rem] md:-translate-x-1/2";

export function BottomSheetHandle() {
  return (
    <div className="flex justify-center pt-2 md:hidden">
      <span className="h-1 w-12 rounded-full bg-border/80" aria-hidden />
    </div>
  );
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  header,
  children,
  contentClassName,
  contentStyle,
  testId = "app-bottom-sheet",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  header?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  testId?: string;
}) {
  return (
    <Dialog
      modal
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        style={contentStyle}
        data-testid={testId}
        className={cn(
          BOTTOM_SHEET_FRAME_CLASS,
          "max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)]",
          contentClassName
        )}
      >
        {header ?? (
          <div className="border-b px-4 pb-3">
            <BottomSheetHandle />
            <DialogTitle className="pt-2 font-display text-lg font-semibold tracking-tight">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="pt-1">{description}</DialogDescription>
            ) : null}
          </div>
        )}
        {header ? (
          <>
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {description ?? title}
            </DialogDescription>
          </>
        ) : null}
        {!header && !description ? (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        ) : null}
        <div className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
