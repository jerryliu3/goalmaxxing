"use client";

import { useUiStyle } from "./ui-style-provider";
import { getBrandFontStylesheet } from "@/lib/brand/theme-library";

export function ApplicationThemeFonts() {
  const { styleId } = useUiStyle();
  if (styleId === "original" || styleId === "gazetteer") return null;
  return <link rel="stylesheet" href={getBrandFontStylesheet(styleId)} />;
}
