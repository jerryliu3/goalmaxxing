import type { Metadata } from "next";
import { WeekWeaveStudy } from "@/features/ux-goal-view/weave-study";

export const metadata: Metadata = { title: "Time Weave · Week vs Goal View · Goalmaxxing" };
export default function TimeWeavePage() { return <WeekWeaveStudy />; }
