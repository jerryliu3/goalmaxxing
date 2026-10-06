import type { ComponentType } from "react";
import { CoinFamilyMark, CoinMark } from "@/features/ux-medals/coin-marks";
import { EnamelFamilyMark, EnamelMark } from "@/features/ux-medals/enamel-marks";
import type { FamilyMarkProps, LevelMarkProps } from "@/features/ux-medals/mark-kit";
import type { MedalDirectionSlug } from "@/features/ux-medals/model";
import { PostmarkFamilyMark, PostmarkMark } from "@/features/ux-medals/postmark-marks";
import { SealFamilyMark, SealMark } from "@/features/ux-medals/seal-marks";

export const DIRECTION_MARKS: Record<
  MedalDirectionSlug,
  { Level: ComponentType<LevelMarkProps>; Family: ComponentType<FamilyMarkProps> }
> = {
  postmark: { Level: PostmarkMark, Family: PostmarkFamilyMark },
  seal: { Level: SealMark, Family: SealFamilyMark },
  enamel: { Level: EnamelMark, Family: EnamelFamilyMark },
  coin: { Level: CoinMark, Family: CoinFamilyMark },
};
