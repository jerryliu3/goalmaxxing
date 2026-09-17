import type { CardMaterial } from "./materials";
import { ApplicationCards } from "./application-cards";
import { RewardShowcase } from "./reward-showcase";

export function ArtifactShowcase({ mode, ...props }: {
  mode: "application" | "objects"; material: CardMaterial; still: boolean; color: string;
}) {
  return mode === "application" ? <ApplicationCards {...props} /> : <RewardShowcase {...props} />;
}
