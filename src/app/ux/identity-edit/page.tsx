import type { Metadata } from "next";
import { IdentityEditStudy } from "@/features/ux-identity-edit/study";

export const metadata: Metadata = { title: "Header identity & goal editing · Goalmaxxing" };
export default function IdentityEditPage() { return <IdentityEditStudy />; }
