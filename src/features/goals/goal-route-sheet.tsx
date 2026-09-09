"use client";

import { X } from "lucide-react";
import {
  type ReactNode,
  type TouchEvent,
  useCallback,
  useRef,
} from "react";
import { BottomSheet, BottomSheetHandle } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
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

      onClose();
    },
    [isMobileViewport, onClose]
  );

  return (
    <BottomSheet
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={title}
      testId="goal-route-sheet"
      contentClassName="h-[min(92dvh,100dvh)] max-h-[92dvh] md:w-[min(100vw-3rem,64rem)] md:max-w-[64rem] md:h-[88dvh] md:max-h-[88dvh]"
      header={
        <div
          className="border-b bg-background/95 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80"
          onTouchStart={onHeaderTouchStart}
          onTouchEnd={onHeaderTouchEnd}
        >
          <BottomSheetHandle />
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="hidden md:inline-flex"
              onClick={onClose}
              aria-label={closeButtonLabel}
              data-no-swipe="true"
            >
              <X />
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </BottomSheet>
  );
}
