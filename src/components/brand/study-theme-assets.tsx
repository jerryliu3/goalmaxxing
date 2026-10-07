import { googleFontsHref, renderStudyThemeCss, THEMES } from "@cadence/shared/brand";

const STUDY_THEME_CSS = renderStudyThemeCss();
const STUDY_FONTS_HREF = googleFontsHref(
  THEMES.filter((theme) => theme.status === "study").flatMap((theme) => Object.values(theme.fonts))
);

/**
 * Study skins' theme blocks and faces. Rendered only while STUDY_THEMES_ENABLED
 * is on, so production pages carry none of it; React hoists both into <head>.
 */
export function StudyThemeAssets() {
  return (
    <>
      <link rel="stylesheet" href={STUDY_FONTS_HREF} precedence="default" />
      <style href="gm-study-themes" precedence="default">
        {STUDY_THEME_CSS}
      </style>
    </>
  );
}
