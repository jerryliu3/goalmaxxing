"use client";

import { levelFinish } from "./prism/materials";
import { PrismMedal } from "./prism/prism-medal";

export function MedalMark({ level, locked = false, size = 72 }: {
  level: number; locked?: boolean; size?: number;
}) {
  return <PrismMedal finish={levelFinish(level)} numeral={String(level)} locked={locked} size={size} />;
}
