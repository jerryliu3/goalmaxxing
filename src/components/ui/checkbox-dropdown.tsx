"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useOutsidePointerDismiss } from "@/lib/ui/use-outside-pointer-dismiss";

export interface CheckboxDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CheckboxDropdownProps {
  id?: string;
  options: CheckboxDropdownOption[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  placeholder: string;
  allLabel?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

interface DropdownPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

export function CheckboxDropdown({
  id,
  options,
  selectedValues,
  onSelectedValuesChange,
  placeholder,
  allLabel = placeholder,
  enableSearch = false,
  searchPlaceholder = "Search...",
  className,
  triggerClassName,
  menuClassName,
}: CheckboxDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const viewportPadding = 8;
    const gap = 6;
    const defaultMaxHeight = 224;
    const minMenuHeight = 120;
    const searchHeaderHeight = enableSearch ? 40 : 0;
    const triggerRect = trigger.getBoundingClientRect();
    const width = Math.max(triggerRect.width, 180);
    const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
    const spaceAbove = triggerRect.top - viewportPadding;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableHeight = openUpward ? spaceAbove - gap : spaceBelow - gap;
    const maxHeight = Math.max(
      minMenuHeight,
      Math.min(defaultMaxHeight, availableHeight - searchHeaderHeight)
    );
    const unclampedTop = openUpward
      ? triggerRect.top - gap - maxHeight - searchHeaderHeight
      : triggerRect.bottom + gap;
    const top = Math.min(
      Math.max(viewportPadding, unclampedTop),
      window.innerHeight - viewportPadding - maxHeight - searchHeaderHeight
    );
    const left = Math.min(
      Math.max(viewportPadding, triggerRect.left),
      window.innerWidth - viewportPadding - width
    );

    setPosition({ left, top, width, maxHeight });
  }, [enableSearch]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  useOutsidePointerDismiss({
    enabled: open,
    containerRef,
    onDismiss: () => setOpen(false),
    shouldIgnoreTarget: (target) =>
      triggerRef.current?.contains(target) === true ||
      menuRef.current?.contains(target) === true,
  });

  const selectedSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues]
  );

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(option.value)),
    [options, selectedSet]
  );

  const visibleOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!enableSearch || normalizedQuery.length === 0) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [enableSearch, options, searchQuery]);

  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0]?.label ?? placeholder
        : `${selectedOptions.length} selected`;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-full border border-input bg-background/90 px-3 text-xs text-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          triggerClassName
        )}
        onClick={() => {
          setOpen((previous) => {
            const next = !previous;
            if (!next) {
              setSearchQuery("");
            }
            return next;
          });
        }}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open ? "rotate-180" : ""
          )}
        />
      </button>
      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              data-slot="checkbox-dropdown-menu"
              className={cn(
                "fixed z-[120] flex flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
                menuClassName
              )}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                maxHeight: position.maxHeight + (enableSearch ? 40 : 0),
                pointerEvents: "auto",
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
            >
              {enableSearch ? (
                <div className="shrink-0 border-b border-border/60 bg-popover px-2 py-1.5">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className="h-7 text-xs"
                    onKeyDown={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                  />
                </div>
              ) : null}
              <div
                className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-1"
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60">
                  <input
                    type="checkbox"
                    checked={selectedValues.length === 0}
                    onChange={() => onSelectedValuesChange([])}
                    className="size-4 shrink-0 accent-secondary"
                  />
                  <span className="min-w-0 truncate">{allLabel}</span>
                </label>
                {visibleOptions.map((option) => {
                  const checked = selectedSet.has(option.value);
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60",
                        option.disabled ? "cursor-not-allowed opacity-60" : ""
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={option.disabled}
                        checked={checked}
                        onChange={() => {
                          if (option.disabled) {
                            return;
                          }
                          onSelectedValuesChange(
                            checked
                              ? selectedValues.filter((value) => value !== option.value)
                              : [...selectedValues, option.value]
                          );
                        }}
                        className="size-4 shrink-0 accent-secondary"
                      />
                      <span className="min-w-0 truncate">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
