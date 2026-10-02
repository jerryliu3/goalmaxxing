import type { Metadata } from "next";
import { WeekWeaveStudy } from "@/features/ux-goal-view/weave-study";

export const metadata: Metadata = { title: "Time Weave · Week study · Goalmaxxing" };
export default function TimeWeavePage() { return <WeekWeaveStudy />; }
