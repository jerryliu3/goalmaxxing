import type { HTMLAttributes } from "react";
import type { BrandThemeId } from "@cadence/shared/brand";
import { getBrandFontStylesheet, getBrandThemeStyle, type BrandFontFamilies } from "@/lib/brand/theme-library";
import styles from "./brand-theme-scope.module.css";

type BrandThemeScopeProps = HTMLAttributes<HTMLDivElement> & {
  themeId: BrandThemeId;
  /** Disable when the host loads the theme's faces, e.g. through next/font. */
  loadFonts?: boolean;
  fontFamilies?: BrandFontFamilies;
};

/** Reusable on study pages or application subtrees; never changes document preferences. */
export function BrandThemeScope({ themeId, loadFonts = true, fontFamilies, className, style, children, ...props }: BrandThemeScopeProps) {
  return (
    <>
      {loadFonts && <link rel="stylesheet" href={getBrandFontStylesheet(themeId)} />}
      <div {...props} data-brand-theme={themeId} className={[styles.scope, className].filter(Boolean).join(" ")} style={{ ...getBrandThemeStyle(themeId, fontFamilies), ...style }}>
        {children}
      </div>
    </>
  );
}
