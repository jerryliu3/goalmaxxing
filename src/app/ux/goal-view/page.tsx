import type { Metadata } from "next";
import { GoalViewStudy } from "@/features/ux-goal-view/study";

export const metadata: Metadata = { title: "Goal View studies · Goalmaxxing" };
export default function GoalViewPage() { return <GoalViewStudy />; }
