/** Emoji plus one word for narrow portrait tiles; wide layouts keep full names. */
const shortLabels: Record<string, string> = {
  "Tempo run": "🏃 Run",
  Strength: "🏋️ Lift",
  "Read 10 pages": "📖 Read",
  "Read 20 pages": "📖 Read",
  "Deep work": "🎯 Focus",
  "Budget review": "💰 Budget",
  "Plan review": "🗓️ Plan",
  "Goal review": "📝 Review",
  "Weekly review": "📝 Review",
  "Weekly reset": "🔄 Reset",
  "Launch notes": "🗒️ Notes",
  "Launch copy": "✍️ Copy",
  "Team sync": "🤝 Sync",
  Roadmap: "🗓️ Plan",
  Mobility: "🤸 Move",
  "Meal prep": "🥗 Meals",
  "Evening walk": "🚶 Walk",
  "Long ride": "🚴 Ride",
  "Bike commute": "🚲 Bike",
  Yoga: "🧘 Yoga",
  Focus: "🎯 Focus",
  Update: "📝 Update",
};

export function landingCalendarShortLabel(label: string): string {
  return shortLabels[label] ?? "📌 Goal";
}
