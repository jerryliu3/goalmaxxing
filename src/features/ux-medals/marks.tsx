import type { ComponentType } from "react";
import type { FamilyMarkProps, LevelMarkProps } from "@/features/ux-medals/mark-kit";
import { MarkFamilyMark, MarkMark } from "@/features/ux-medals/mark-marks";
import type { MedalDirectionSlug } from "@/features/ux-medals/model";
import {
  MachinedFamilyMark,
  MachinedMark,
  PrismFamilyMark,
  PrismMark,
} from "@/features/ux-medals/premium-marks";
import { TileFamilyMark, TileMark } from "@/features/ux-medals/tile-marks";
import { TokenFamilyMark, TokenMark } from "@/features/ux-medals/token-marks";

export const DIRECTION_MARKS: Record<
  MedalDirectionSlug,
  { Level: ComponentType<LevelMarkProps>; Family: ComponentType<FamilyMarkProps> }
> = {
  machined: { Level: MachinedMark, Family: MachinedFamilyMark },
  prism: { Level: PrismMark, Family: PrismFamilyMark },
  tile: { Level: TileMark, Family: TileFamilyMark },
  token: { Level: TokenMark, Family: TokenFamilyMark },
  mark: { Level: MarkMark, Family: MarkFamilyMark },
};
