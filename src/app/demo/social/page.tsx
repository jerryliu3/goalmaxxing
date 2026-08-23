"use client";

import { useSearchParams } from "next/navigation";
import { SocialPageBody } from "@/features/social/social-page-body";

export default function DemoSocialPage() {
  const tab = useSearchParams().get("tab") ?? undefined;
  return <SocialPageBody initialTab={tab} />;
}
