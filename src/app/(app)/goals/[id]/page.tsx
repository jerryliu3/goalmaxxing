import { GoalEditPageEntry } from "@/features/goals/goal-edit-page-entry";

interface GoalEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function GoalEditPage({ params }: GoalEditPageProps) {
  const { id } = await params;

  return <GoalEditPageEntry goalId={id} />;
}
