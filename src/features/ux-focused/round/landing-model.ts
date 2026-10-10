import { TODAY, type Person } from "../model";
export type Story = "rhythm" | "project" | "together";
export const LANDING_STORIES = [
  {
    id: "rhythm" as const,
    label: "Build a rhythm",
    title: "Run a comfortable 10K",
    artifact: "run" as const,
    detail: "An October running goal, placed around your week.",
    target: 12,
    question: "How much room is there this month?",
  },
  {
    id: "project" as const,
    label: "Finish a project",
    title: "Finish the short film",
    artifact: "film" as const,
    detail: "Six editing sessions toward a finished short film.",
    target: 6,
    question: "What is the next concrete step?",
  },
  {
    id: "together" as const,
    label: "Grow together",
    title: "Finish our short film",
    artifact: "film" as const,
    detail: "One shared goal. Contributions from two people.",
    target: 6,
    question: "What will you and your partner work on?",
  },
];
export type LessonSession = {
  id: string;
  title: string;
  date: string;
  minutes: number;
  person: Person;
};
export const LESSON_PLANS: Record<Story, readonly LessonSession[]> = {
  rhythm: [
    {
      id: "first",
      title: "Easy run",
      date: "2026-10-05",
      minutes: 25,
      person: "you",
    },
    {
      id: "second",
      title: "Tempo run",
      date: "2026-10-07",
      minutes: 30,
      person: "you",
    },
    {
      id: "change",
      title: "Easy run",
      date: TODAY,
      minutes: 25,
      person: "you",
    },
  ],
  project: [
    {
      id: "first",
      title: "Select the opening shots",
      date: "2026-10-05",
      minutes: 40,
      person: "you",
    },
    {
      id: "second",
      title: "Storyboard the opening",
      date: "2026-10-07",
      minutes: 30,
      person: "you",
    },
    {
      id: "change",
      title: "Build the rough cut",
      date: TODAY,
      minutes: 50,
      person: "you",
    },
  ],
  together: [
    {
      id: "first",
      title: "Sketch the story",
      date: "2026-10-05",
      minutes: 40,
      person: "you",
    },
    {
      id: "second",
      title: "Select the opening shots",
      date: "2026-10-07",
      minutes: 30,
      person: "partner",
    },
    {
      id: "change",
      title: "Build the rough cut",
      date: TODAY,
      minutes: 50,
      person: "you",
    },
    {
      id: "review",
      title: "Review the rough cut",
      date: "2026-10-09",
      minutes: 30,
      person: "partner",
    },
  ],
};
export type LessonState = {
  story: Story;
  target: 8 | 12;
  moved: boolean;
  saved: boolean;
  completed: string[];
};
export function initialLesson(story: Story = "rhythm"): LessonState {
  return {
    story,
    target: 12,
    moved: false,
    saved: false,
    completed: story === "together" ? ["first", "second"] : ["first"],
  };
}
export function lessonSessions(state: LessonState) {
  return LESSON_PLANS[state.story]
    .filter(
      (s) =>
        state.story !== "rhythm" || state.target === 12 || s.id !== "second",
    )
    .map((s) => ({
      ...s,
      date: s.id === "change" && state.moved ? "2026-10-09" : s.date,
      done: state.completed.includes(s.id),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
export type LessonAction =
  | { type: "story"; story: Story }
  | { type: "target"; target: 8 | 12 }
  | { type: "move" }
  | { type: "undo" }
  | { type: "save" }
  | { type: "toggle"; id: string }
  | { type: "reset" };
export function lessonReducer(
  state: LessonState,
  action: LessonAction,
): LessonState {
  if (action.type === "story")
    return state.story === action.story ? state : initialLesson(action.story);
  if (action.type === "reset") return initialLesson(state.story);
  if (action.type === "target")
    return state.story === "rhythm" && state.target !== action.target
      ? { ...initialLesson(state.story), target: action.target }
      : state;
  if (action.type === "move")
    return state.completed.includes("change")
      ? state
      : { ...state, moved: true, saved: false };
  if (action.type === "save")
    return state.moved ? { ...state, saved: true } : state;
  if (action.type === "undo")
    return state.saved ? state : { ...state, moved: false };
  const s = lessonSessions(state).find((s) => s.id === action.id);
  if (
    !s ||
    s.person !== "you" ||
    s.date > TODAY ||
    (s.id === "change" && state.moved && !state.saved)
  )
    return state;
  return {
    ...state,
    completed: s.done
      ? state.completed.filter((id) => id !== s.id)
      : [...state.completed, s.id],
  };
}
