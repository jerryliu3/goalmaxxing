"use client";

import { UiStylePicker } from "@/components/brand/ui-style-picker";
import { useUiStyle } from "@/components/brand/ui-style-provider";

export function AppearanceSettings() {
  const { style } = useUiStyle();

  return (
    <div className="space-y-4">
      <UiStylePicker />
      <p className="text-sm text-muted-foreground">{style.description}</p>
      <p className="text-xs text-muted-foreground">
        Changes apply right away on this device.
      </p>
    </div>
  );
}
