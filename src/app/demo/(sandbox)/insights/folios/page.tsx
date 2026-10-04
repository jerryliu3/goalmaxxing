import { redirect } from "next/navigation";
export default async function GoalCollection({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  redirect(view === "past" ? "/demo/achievements#progress-section-past-goals" : "/demo/goals/library");
}
