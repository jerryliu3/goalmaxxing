import { GAZETTEER } from "../brand/gazetteer";
import { normalizeCategoryDisplayColor } from "../brand/categories";

export const WORK_PILL_HUE_AMOUNT = 0.24;
export const WORK_PILL_DRAFT_HUE_AMOUNT = 0.48;
export const WORK_PILL_NEW_DRAFT_HUE_AMOUNT = 0.62;
export const WORK_PILL_INK = "#1c1917";

function parseHexChannels(hex: string): [number, number, number] {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHexChannel(value: number) {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");
}

export function mixOpaqueHex(hex: string, paper: string, amount: number): string {
  const [red, green, blue] = parseHexChannels(hex);
  const [paperRed, paperGreen, paperBlue] = parseHexChannels(paper);
  const rest = 1 - amount;
  return `#${toHexChannel(red * amount + paperRed * rest)}${toHexChannel(
    green * amount + paperGreen * rest
  )}${toHexChannel(blue * amount + paperBlue * rest)}`;
}

export function normalizeGazetteerGoalColor(color: string | null | undefined) {
  const trimmed = color?.trim();
  if (!trimmed) {
    return null;
  }
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }
  return normalizeCategoryDisplayColor(hex);
}

export function getGazetteerWorkPillFillStyle(color: string) {
  const hex = normalizeGazetteerGoalColor(color) ?? GAZETTEER.stamp;
  const fill = mixOpaqueHex(hex, GAZETTEER.paper, WORK_PILL_HUE_AMOUNT);
  return {
    backgroundColor: fill,
    borderColor: fill,
    color: WORK_PILL_INK,
  };
}

export function getGazetteerWorkPillDraftFillStyle(
  color: string,
  kind: "moved_to" | "new" = "moved_to"
) {
  const hex = normalizeGazetteerGoalColor(color) ?? GAZETTEER.stamp;
  const amount =
    kind === "new" ? WORK_PILL_NEW_DRAFT_HUE_AMOUNT : WORK_PILL_DRAFT_HUE_AMOUNT;
  const fill = mixOpaqueHex(hex, GAZETTEER.paper, amount);
  const border = mixOpaqueHex(hex, GAZETTEER.paper, Math.min(1, amount + 0.18));
  return {
    backgroundColor: fill,
    borderColor: border,
    color: WORK_PILL_INK,
  };
}
