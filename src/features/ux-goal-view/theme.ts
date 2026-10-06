import type { CSSProperties } from "react";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";

export const studyTheme = {
  "--gv-page": GAZETTEER.page, "--gv-paper": GAZETTEER.paper,
  "--gv-ink": GAZETTEER.ink, "--gv-muted": GAZETTEER.muted,
  "--gv-deep": GAZETTEER.mutedDeep, "--gv-rule": GAZETTEER.rule,
  "--gv-stamp": GAZETTEER.stamp,
} as CSSProperties;
