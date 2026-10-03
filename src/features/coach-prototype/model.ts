// This is a deterministic interaction study. It never calls coach or domain APIs.
export const TODAY = "2026-10-02";
export const DAYS = [
  { date: "2026-09-28", name: "Mon", number: "28" },
  { date: "2026-09-29", name: "Tue", number: "29" },
  { date: "2026-09-30", name: "Wed", number: "30" },
  { date: "2026-10-01", name: "Thu", number: "1" },
  { date: TODAY, name: "Fri", number: "2" },
  { date: "2026-10-03", name: "Sat", number: "3" },
  { date: "2026-10-04", name: "Sun", number: "4" },
] as const;
export type Surface = "Plan" | "Checklist" | "Progress" | "Community" | "You";
export type Mode = "minimized" | "companion" | "expanded";
export type View = "conversation" | "rooms" | "understanding" | "checkin" | "changes";
export type Tone = "blue" | "green" | "violet" | "amber";
export type Session = { id: string; goal: string; title: string; date: string; time: string; done: boolean; tone: Tone; task?: boolean };
export type Topic = { id: string; title: string; note: string; intention: string; tone: Tone; goals: string[]; archived: boolean };
export type Change = { id: string; sessionId: string; from: string; to: string; fromTime: string; toTime: string; revision: number; status: "proposed" | "applied" | "dismissed" | "undone" };
export type Message = { id: string; role: "user" | "coach"; text: string; context?: string; change?: Change; memory?: string; memorySaved?: boolean };
export type Thread = { id: string; topicId: string; title: string; messages: Message[]; draft: string };
export type Memory = { id: string; topicId: string; text: string };
export type State = {
  mode: Mode; view: View; surface: Surface; selectedDate: string; selectedSession: string | null;
  topicId: string; threadId: string; topics: Topic[]; threads: Thread[];
  sessions: Session[]; memories: Memory[]; revision: number; notice: string;
};
const sessions: Session[] = [
  { id: "write-mon", goal: "Writing", title: "Write a first draft", date: DAYS[0].date, time: "09:00", done: true, tone: "blue" },
  { id: "strength-mon", goal: "Strength", title: "Strength session", date: DAYS[0].date, time: "17:30", done: true, tone: "green" },
  { id: "run-tue", goal: "Running", title: "Easy run", date: DAYS[1].date, time: "07:30", done: true, tone: "green" },
  { id: "write-wed", goal: "Writing", title: "Write a first draft", date: DAYS[2].date, time: "09:00", done: true, tone: "blue" },
  { id: "run-thu", goal: "Running", title: "Easy run", date: DAYS[3].date, time: "07:30", done: true, tone: "green" },
  { id: "read-thu", goal: "Reading", title: "Read for 20 minutes", date: DAYS[3].date, time: "20:00", done: false, tone: "violet" },
  { id: "run-fri", goal: "Running", title: "Easy run", date: TODAY, time: "07:30", done: true, tone: "green" },
  { id: "write-fri", goal: "Writing", title: "Write a first draft", date: TODAY, time: "15:00", done: false, tone: "blue" },
  { id: "strength-fri", goal: "Strength", title: "Strength session", date: TODAY, time: "17:30", done: false, tone: "green" },
  { id: "review-fri", goal: "Personal", title: "Send project notes", date: TODAY, time: "18:00", done: false, tone: "amber", task: true },
  { id: "read-sat", goal: "Reading", title: "Read for 20 minutes", date: DAYS[5].date, time: "10:00", done: false, tone: "violet" },
  { id: "write-sun", goal: "Writing", title: "Write a first draft", date: DAYS[6].date, time: "09:00", done: false, tone: "blue" },
];
export function initialState(): State {
  return {
    mode: "companion", view: "conversation", surface: "Plan", selectedDate: TODAY, selectedSession: null,
    topicId: "week", threadId: "week-main", sessions: sessions.map(row => ({ ...row })), revision: 1, notice: "",
    topics: [
      { id: "week", title: "My week", note: "Make space for what matters, even when the week shifts.", intention: "Keep a sustainable rhythm across work and health.", tone: "blue", goals: ["Writing", "Running", "Strength"], archived: false },
      { id: "writing", title: "A writing practice", note: "Consistency before polish. Small sessions, a real first draft.", intention: "Finish a first draft without making every session a big event.", tone: "violet", goals: ["Writing"], archived: false },
      { id: "energy", title: "Energy & recovery", note: "A week that leaves something in the tank.", intention: "Balance running and strength with enough recovery.", tone: "green", goals: ["Running", "Strength"], archived: false },
    ],
    threads: [
      { id: "week-main", topicId: "week", title: "Making room this week", draft: "", messages: [] },
      { id: "writing-main", topicId: "writing", title: "Making the first draft easier", draft: "", messages: [
        { id: "writing-1", role: "user", text: "I keep waiting for a long, uninterrupted block before I write." },
        { id: "writing-2", role: "coach", text: "You don’t need to solve the whole draft in one sitting. Let’s protect a small start and make that the win. You’ve already shown up twice this week.", context: "Writing · two completed sessions this week" },
      ] },
      { id: "writing-past", topicId: "writing", title: "Finding a morning routine", draft: "", messages: [
        { id: "writing-3", role: "user", text: "Mornings are usually my clearest time." },
        { id: "writing-4", role: "coach", text: "Then mornings are a useful starting point when you ask to adjust your writing plan. I’ll keep that preference separate from your actual schedule." },
      ] },
      { id: "energy-main", topicId: "energy", title: "Training without draining the week", draft: "", messages: [
        { id: "energy-1", role: "user", text: "I want training to support my work, not leave me exhausted." },
        { id: "energy-2", role: "coach", text: "That gives us a useful priority: sustainable energy. We can look at the placements together before changing anything." },
      ] },
    ],
    memories: [{ id: "morning", topicId: "writing", text: "Mornings are usually my clearest time." }],
  };
}
export function dateLabel(date: string) {
  const day = DAYS.find(row => row.date === date);
  return day ? `${day.name} ${day.number}` : date;
}
export function contextFor(state: State) {
  const today = state.sessions.filter(row => row.date === TODAY);
  const selected = state.sessions.find(row => row.id === state.selectedSession);
  const purpose: Record<Surface, string> = {
    Plan: "Place and adapt scheduled work", Checklist: "Do and record your work",
    Progress: "Understand progress over time", Community: "Connect with your people", You: "Your preferences and account",
  };
  return {
    today, todayDone: today.filter(row => row.done).length,
    weekDone: state.sessions.filter(row => row.done).length, weekTotal: state.sessions.length,
    selected, page: `${state.surface}${state.surface === "Plan" || state.surface === "Checklist" ? ` · ${dateLabel(state.selectedDate)}` : ""}`,
    purpose: purpose[state.surface],
  };
}
export function changeIsStale(state: State, change: Change) { return change.status === "proposed" && change.revision !== state.revision; }
export function allChanges(state: State) {
  return state.threads.flatMap(thread => thread.messages.flatMap(message => message.change ? [{ ...message.change, topicId: thread.topicId }] : []));
}
export type Event =
  | { type: "mode"; value: Mode } | { type: "view"; value: View }
  | { type: "surface"; value: Surface } | { type: "date"; value: string } | { type: "select"; id: string | null }
  | { type: "complete"; id: string } | { type: "draft"; threadId: string; value: string }
  | { type: "message"; threadId: string; message: Message } | { type: "topic"; id: string } | { type: "thread"; id: string }
  | { type: "new-thread"; id: string } | { type: "new-topic"; id: string; title: string }
  | { type: "edit-topic"; id: string; title: string; intention: string; goals: string[] } | { type: "archive-topic"; id: string }
  | { type: "change"; id: string; operation: "apply" | "dismiss" | "undo" | "refresh" }
  | { type: "memory"; threadId: string; messageId: string; id: string } | { type: "forget"; id: string }
  | { type: "notice"; value: string } | { type: "reset" };
export function reducer(state: State, event: Event): State {
  switch (event.type) {
    case "mode": return { ...state, mode: event.value };
    case "view": return { ...state, view: event.value, mode: state.mode === "minimized" ? "companion" : state.mode };
    case "surface": return { ...state, surface: event.value, selectedSession: null };
    case "date": return { ...state, selectedDate: event.value, selectedSession: null };
    case "select": return { ...state, selectedSession: event.id };
    case "complete": return { ...state, revision: state.revision + 1, sessions: state.sessions.map(row => row.id === event.id ? { ...row, done: !row.done } : row), notice: "Your coach’s context is up to date." };
    case "draft": return { ...state, threads: state.threads.map(thread => thread.id === event.threadId ? { ...thread, draft: event.value } : thread) };
    case "message": return { ...state, threads: state.threads.map(thread => thread.id === event.threadId ? {
      ...thread,
      title: thread.title === "A fresh conversation" && event.message.role === "user" ? event.message.text.slice(0, 48) : thread.title,
      messages: [...thread.messages, event.message],
    } : thread) };
    case "thread": {
      const thread = state.threads.find(row => row.id === event.id);
      return thread ? { ...state, topicId: thread.topicId, threadId: thread.id, view: "conversation" } : state;
    }
    case "topic": {
      const thread = state.threads.find(row => row.topicId === event.id);
      return thread ? { ...state, topicId: event.id, threadId: thread.id, view: "conversation" } : state;
    }
    case "new-thread": return { ...state, threadId: event.id, view: "conversation", threads: [...state.threads, { id: event.id, topicId: state.topicId, title: "A fresh conversation", messages: [], draft: "" }] };
    case "new-topic": return { ...state, topicId: event.id, threadId: `${event.id}-main`, view: "conversation", topics: [...state.topics, { id: event.id, title: event.title, intention: "", note: "A little room for a new line of thought.", goals: [], tone: "amber", archived: false }], threads: [...state.threads, { id: `${event.id}-main`, topicId: event.id, title: "A fresh conversation", draft: "", messages: [] }] };
    case "edit-topic": return { ...state, topics: state.topics.map(topic => topic.id === event.id ? { ...topic, title: event.title, intention: event.intention, goals: event.goals } : topic), notice: "Room updated." };
    case "archive-topic": return { ...state, topics: state.topics.map(topic => topic.id === event.id ? { ...topic, archived: !topic.archived } : topic), notice: "Room visibility updated. Its history is kept." };
    case "forget": {
      const memory = state.memories.find(row => row.id === event.id);
      return { ...state, memories: state.memories.filter(row => row.id !== event.id),
        threads: state.threads.map(thread => memory && thread.topicId === memory.topicId ? { ...thread, messages: thread.messages.map(message => message.memory === memory.text ? { ...message, memorySaved: false } : message) } : thread),
        notice: "Preference forgotten.",
      };
    }
    case "memory": {
      const thread = state.threads.find(row => row.id === event.threadId);
      const message = thread?.messages.find(row => row.id === event.messageId);
      if (!thread || !message?.memory || message.memorySaved) return state;
      return { ...state, memories: [...state.memories, { id: event.id, topicId: thread.topicId, text: message.memory }], threads: state.threads.map(row => row.id === thread.id ? { ...row, messages: row.messages.map(item => item.id === message.id ? { ...item, memorySaved: true } : item) } : row), notice: "Preference saved for this room." };
    }
    case "change": {
      const change = allChanges(state).find(row => row.id === event.id);
      const session = state.sessions.find(row => row.id === change?.sessionId);
      if (!change || !session) return state;
      if (event.operation === "apply" && (change.status !== "proposed" || changeIsStale(state, change))) return { ...state, notice: "Your plan changed. Refresh this proposal before applying it." };
      if (event.operation === "undo" && (change.status !== "applied" || session.date !== change.to || session.time !== change.toTime || session.done)) return { ...state, notice: "This session changed again. Keep the newer edit and ask for a fresh proposal." };
      if (event.operation === "refresh" && (change.status !== "proposed" || session.done)) return { ...state, notice: "This session is complete; there is nothing to move." };
      if (event.operation === "dismiss" && change.status !== "proposed") return state;
      const updated: Change = event.operation === "refresh" ? { ...change, revision: state.revision, from: session.date, fromTime: session.time }
        : { ...change, status: event.operation === "apply" ? "applied" : event.operation === "undo" ? "undone" : "dismissed" };
      const moving = event.operation === "apply" || event.operation === "undo";
      return { ...state,
        revision: state.revision + (moving ? 1 : 0),
        sessions: moving ? state.sessions.map(row => row.id === session.id ? { ...row, date: event.operation === "undo" ? change.from : change.to, time: event.operation === "undo" ? change.fromTime : change.toTime } : row) : state.sessions,
        threads: state.threads.map(thread => ({ ...thread, messages: thread.messages.map(message => message.change?.id === event.id ? { ...message, change: updated } : message) })),
        notice: event.operation === "apply" ? "Plan updated. Your week has the same amount of work, with more room today." : event.operation === "undo" ? "Session returned to its original placement." : event.operation === "refresh" ? "Proposal refreshed against your current plan." : "Proposal dismissed. Your plan is unchanged.",
      };
    }
    case "notice": return { ...state, notice: event.value };
    case "reset": return initialState();
  }
}

export function replyFor(state: State, question: string, id: string): Message {
  const facts = contextFor(state);
  const topic = state.topics.find(row => row.id === state.topicId)!;
  const reply: Message = { id, role: "coach", text: "", context: `${facts.page} · ${facts.todayDone}/${facts.today.length} today · ${facts.weekDone}/${facts.weekTotal} this week` };
  if (/move|shift|lighter|overwhelm|resched|too much|heavy|make room/i.test(question)) {
    const candidate = facts.selected && !facts.selected.done ? facts.selected : state.sessions.find(row => row.date === TODAY && !row.done && !row.task);
    if (!candidate) return { ...reply, text: "There isn’t any incomplete scheduled work left today to move. You can use the room to reflect on the week, or select a different session in Plan." };
    const to = candidate.date === DAYS[5].date ? DAYS[6].date : DAYS[5].date;
    return { ...reply, text: `We can give ${candidate.date === TODAY ? "today" : dateLabel(candidate.date)} a little breathing room. Move “${candidate.title}” to ${dateLabel(to)} at 11:00, keeping the same weekly commitment. Here’s the exact change for you to review.`, change: { id: `${id}-change`, sessionId: candidate.id, from: candidate.date, fromTime: candidate.time, to, toTime: "11:00", revision: state.revision, status: "proposed" } };
  }
  if (/remember|prefer|morning|evening/i.test(question)) return { ...reply, text: "That’s useful to know. I can keep your exact words as a preference in this room, if you want. Remembering this won’t change your schedule.", memory: question };
  if (/check.?in|recap|yesterday|review/i.test(question)) {
    const past = state.sessions.filter(row => /weekly/i.test(question) ? row.date < TODAY : row.date === DAYS[3].date);
    return { ...reply, text: `You recorded ${past.filter(row => row.done).length} of ${past.length} items ${/weekly/i.test(question) ? "before today this week" : "yesterday"}. Today has ${facts.today.length - facts.todayDone} remaining items. We can keep the recap as a record of what happened and use your current plan to decide what to do next.` };
  }
  if (facts.selected) return { ...reply, text: `You’re looking at “${facts.selected.title}” on ${dateLabel(facts.selected.date)} at ${facts.selected.time}. ${facts.selected.done ? "It’s already recorded as complete." : "It’s still planned, not completed."} ${facts.selected.goal === "Writing" ? "The useful next step is a small first draft, rather than a polished piece." : "Think of this session as one part of the week, not the whole commitment."} If this placement no longer fits, ask me to move it.` };
  if (state.surface === "Community") return { ...reply, text: "You’re in Community, where shared activity gives you a little company. Your private coach context still concerns your own goals and work. We can talk about your rhythm without guessing at another person’s private information." };
  if (state.surface === "You") {
    const memory = state.memories.find(row => row.topicId === topic.id);
    return { ...reply, text: `You’re looking at your preferences. ${memory ? `In this room, you’ve asked me to keep: “${memory.text}”` : "There are no confirmed preferences in this room yet."} Remembered preferences are separate from planner settings; a change to either should be explicit.` };
  }
  const goalRows = state.sessions.filter(row => topic.goals.includes(row.goal));
  return { ...reply, text: topic.id === "week"
    ? `You’ve recorded ${facts.weekDone} of ${facts.weekTotal} planned items this week. Today is ${facts.todayDone} of ${facts.today.length}, with ${facts.today.length - facts.todayDone} still ahead. You don’t need to squeeze everything into the next hour. Pick one useful step, and we can make room around it if today feels crowded.`
    : `In this room, we’re working toward: ${topic.intention || topic.note} Of the ${goalRows.length} linked sessions this week, ${goalRows.filter(row => row.done).length} ${goalRows.filter(row => row.done).length === 1 ? "is" : "are"} complete. ${topic.id === "writing" ? "A short, imperfect start still counts. What would make your next writing session easier?" : "What feels sustainable today, and what needs a little adjustment?"}` };
}
