import type { CoachConversation } from "./contracts";

/** Older pages contribute history; only the latest refresh owns current metadata. */
export function mergeCoachConversation(previous: CoachConversation | undefined, incoming: CoachConversation, before?: number, current = true): CoachConversation {
  if (!previous) return incoming;
  const metadata = current && incoming.thread.version >= previous.thread.version ? incoming : previous;
  // A reconnect can jump past an entire page. Restart from the latest page so
  // Earlier messages can fill the gap instead of preserving an exhausted cursor.
  if (before === undefined && metadata === incoming && previous.messages.length && incoming.messages.length
    && incoming.messages[0].sequence > previous.messages.at(-1)!.sequence) return incoming;
  const messages = [...new Map([...previous.messages, ...incoming.messages].map(message => [message.id, message])).values()].sort((a,b) => a.sequence-b.sequence);
  const actions = metadata === incoming ? [...previous.actions, ...incoming.actions] : [...incoming.actions, ...previous.actions];
  return { ...metadata, messages,
    actions: [...new Map(actions.map(action => [action.id, action])).values()],
    before: before !== undefined ? incoming.before : previous.messages.length ? previous.before : incoming.before,
  };
}
