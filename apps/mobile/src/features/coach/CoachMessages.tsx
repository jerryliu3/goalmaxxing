import { useState } from "react";
import { Text, View } from "react-native";
import type { CoachMessage } from "@cadence/shared/coach";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";
import { PrimaryButton } from "../../ui/button";
import { CoachActionCard } from "./CoachActionCard";
import { useNativeCoach } from "./coach-context";

function Message({ message }: { message: CoachMessage }) {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const { memorySuggestion: content, memorySourceId: sourceId } = message.source;
  const saved = coach.bootstrap?.memories.some(memory => memory.source_message_id === sourceId && memory.content === content);
  const remember = async (global: boolean) => {
    setBusy(true);
    try { await api.postJson("/api/coach/memories", { topicId: global ? null : coach.conversation?.thread.topic_id ?? null, content, sourceMessageId: sourceId, kind: "preference" }); await coach.loadBootstrap(); }
    catch (error) { coach.setError(error instanceof Error ? error.message : "Could not remember preference."); }
    finally { setBusy(false); }
  };
  return <View style={{ marginBottom: 20, padding: 12, borderRadius: 12, backgroundColor: message.role === "user" ? theme.colors.muted : theme.colors.background }}>
    <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>{message.role === "user" ? "You" : "Coach"}</Text>
    <Text style={{ color: theme.colors.foreground, lineHeight: 22, marginTop: 6 }}>{message.content}</Text>
    {message.role === "assistant" && typeof message.source.asOf === "string" && <Text style={{ color: theme.colors.mutedForeground, fontSize: 11, marginTop: 8 }}>Based on data at {new Date(message.source.asOf).toLocaleTimeString()}{coach.facts.data && message.source.revision !== coach.facts.data.revision ? " · Data has changed since this reply" : ""}</Text>}
    {message.role === "assistant" && coach.conversation?.actions.filter(action => action.run_id === message.run_id).map(action => <CoachActionCard key={action.id} action={action} />)}
    {message.role === "assistant" && typeof content === "string" && typeof sourceId === "string" && <View style={{ marginTop: 12 }}>
      <Text style={{ color: theme.colors.mutedForeground }}>Remember: {content}</Text>
      {saved ? <Text style={{ color: theme.colors.mutedForeground }}>Saved. You can edit or forget this preference in Understanding.</Text> : <>
        <PrimaryButton label="Remember in this topic" disabled={busy} onPress={() => void remember(false)} />
        <PrimaryButton label="Remember in all topics" disabled={busy} onPress={() => void remember(true)} />
      </>}
    </View>}
  </View>;
}
export function CoachMessages() {
  const coach = useNativeCoach()!;
  return <>
    {coach.conversation?.before != null && <PrimaryButton label="Earlier messages" onPress={() => void coach.loadEarlier().catch(error => coach.setError(error.message))} />}
    {coach.conversation?.messages.map(message => <Message key={message.id} message={message} />)}
  </>;
}
