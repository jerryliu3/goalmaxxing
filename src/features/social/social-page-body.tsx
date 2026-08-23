"use client";

import { SocialSurface } from "@/features/social/social-surface";

export function SocialPageBody({ initialTab }: { initialTab?: string }) {
  return <SocialSurface initialTab={initialTab} />;
}
