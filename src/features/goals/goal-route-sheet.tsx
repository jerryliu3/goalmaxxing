"use client";

import { X } from "lucide-react";
import {
  type ReactNode,
  type TouchEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { BottomSheet, BottomSheetHandle } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnsavedChangesContext } from "@/features/goals/unsaved-changes";
import { useMediaQuery } from "@/lib/ui/use-media-query";

interface GoalRouteSheetProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
  closeButtonLabel?: string;
}

const MOBILE_SHEET_BREAKPOINT_QUERY = "(max-width: 767px)";
const SWIPE_CLOSE_MIN_DELTA_Y = 72;

export function GoalRouteSheet({
  children,
  onClose,
  title,
  closeButtonLabel = "Close goal editor",
}: GoalRouteSheetProps) {
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  // Forms inside report unsaved changes; closing then asks before discarding them.
  const [dirty, setDirty] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);
  const isMobileViewport = useMediaQuery(MOBILE_SHEET_BREAKPOINT_QUERY);

  const onHeaderTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!isMobileViewport || event.touches.length !== 1) {
        swipeStartRef.current = null;
        return;
      }

      const target = event.target as HTMLElement | null;
      const ignoreSwipe = target?.closest(
        "a,button,input,textarea,select,label,[role='button'],[data-no-swipe='true']"
      );
      if (ignoreSwipe) {
        swipeStartRef.current = null;
        return;
      }

      const touch = event.touches[0];
      swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [isMobileViewport]
  );

  const onHeaderTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const swipeStart = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!isMobileViewport || !swipeStart || event.changedTouches.length === 0) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - swipeStart.x;
      const deltaY = touch.clientY - swipeStart.y;
      if (
        deltaY < SWIPE_CLOSE_MIN_DELTA_Y ||
        Math.abs(deltaY) <= Math.abs(deltaX) ||
        Math.abs(deltaX) > 120
      ) {
        return;
      }

      requestClose();
    },
    [isMobileViewport, requestClose]
  );

  return (
    <BottomSheet
      open
      onOpenChange={(open) => {
        if (!open) {
          requestClose();
        }
      }}
      title={title}
      testId="goal-route-sheet"
      contentClassName="h-[min(92dvh,100dvh)] max-h-[92dvh] md:w-[min(100vw-3rem,64rem)] md:max-w-[64rem] md:h-[88dvh] md:max-h-[88dvh]"
      header={
        <div
          className="border-b bg-background/95 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6"
          onTouchStart={onHeaderTouchStart}
          onTouchEnd={onHeaderTouchEnd}
        >
          <BottomSheetHandle />
          <div className="flex items-center justify-between gap-3">
            <p aria-hidden className="type-title truncate text-base tracking-tight">
              {title}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="inline-flex"
              onClick={requestClose}
              aria-label={closeButtonLabel}
              data-no-swipe="true"
            >
              <X />
            </Button>
          </div>
        </div>
      }
    >
      <UnsavedChangesContext.Provider value={setDirty}>{children}</UnsavedChangesContext.Provider>
      <Dialog open={confirmingDiscard} onOpenChange={setConfirmingDiscard}>
        {/* Above the sheet (z-70), which stays open behind it. */}
        <DialogContent className="z-[80] sm:max-w-sm" overlayClassName="z-[80]" showCloseButton={false}>
          <DialogTitle>Discard your changes?</DialogTitle>
          <DialogDescription>You’ll lose what you’ve entered so far.</DialogDescription>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmingDiscard(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="destructive" onClick={onClose}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BottomSheet>
  );
}
