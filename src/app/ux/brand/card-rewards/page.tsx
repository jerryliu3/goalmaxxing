import type { Metadata } from "next";
import { RewardStudy } from "@/features/ux-brand/card-rewards/reward-study";

export const metadata: Metadata = { title: "Reward cards · Goalmaxxing" };

export default function RewardCardsPage() {
  return <RewardStudy />;
}
