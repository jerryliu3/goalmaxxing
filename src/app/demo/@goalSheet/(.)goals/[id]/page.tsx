import { GoalEditSheetEntry } from "@/features/goals/goal-edit-sheet-entry";

interface GoalEditSheetPageProps {
  params: Promise<{ id: string }>;
}

export default async function DemoGoalEditSheetPage({ params }: GoalEditSheetPageProps) {
  const { id } = await params;
  return <GoalEditSheetEntry goalId={id} />;
}
