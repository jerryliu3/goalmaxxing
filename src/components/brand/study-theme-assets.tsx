import { googleFontsHref, renderStudyThemeCss, type Theme } from "@cadence/shared/brand";

const STUDY_THEME_CSS = renderStudyThemeCss();

/**
 * Theme blocks are always available for switching. Only the selected study
 * skin's fonts load; Original and Gazetteer use their bundled faces.
 * React hoists these assets into <head> on SSR and client-side switches.
 */
export function StudyThemeAssets({ theme }: { theme: Theme }) {
  return (
    <>
      {theme.status === "study" ? (
        <link rel="stylesheet" href={googleFontsHref(Object.values(theme.fonts))} precedence="default" />
      ) : null}
      <style href="gm-study-themes" precedence="default">
        {STUDY_THEME_CSS}
      </style>
    </>
  );
}
