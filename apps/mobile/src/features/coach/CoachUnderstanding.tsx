import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { CoachMemory, CoachTopic } from "@cadence/shared/coach";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";
import { PrimaryButton } from "../../ui/button";
import { CoachSources } from "./CoachSources";
import { useNativeCoach } from "./coach-context";

function Memory({ memory }: { memory: CoachMemory }) {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const [content, setContent] = useState(memory.content);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const update = async (remove: boolean) => {
    setBusy(true);
    try { await api.requestJson({ path: `/api/coach/memories/${memory.id}`, method: remove ? "DELETE" : "PATCH", body: { version: memory.version, ...(remove ? {} : { content }) } }); await coach.loadBootstrap(); setEditing(false); }
    catch (error) { coach.setError(error instanceof Error ? error.message : "Could not update preference."); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 8, paddingVertical: 12 }}>
    <Text style={{ color: theme.colors.foreground }}>{memory.content}</Text>
    <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>{memory.topic_id ? "This topic" : "All topics"} · {memory.kind === "observation" ? "Tentative observation" : "Your preference"}{memory.source_message_id ? " · from conversation" : " · added or edited by you"}</Text>
    {memory.source_message_id && <CoachSources key={memory.source_message_id} ids={[memory.source_message_id]} />}
    {editing && <><TextInput accessibilityLabel="Preference content" multiline value={content} onChangeText={setContent} maxLength={1000} style={{ color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border, padding: 8 }} /><PrimaryButton label="Save preference" disabled={busy || !content.trim()} onPress={() => void update(false)} /></>}
    <Pressable disabled={busy} onPress={() => setEditing(!editing)}><Text style={{ color: theme.colors.mutedForeground }}>{editing ? "Cancel edit" : "Edit"}</Text></Pressable>
    <PrimaryButton label="Forget" disabled={busy} onPress={() => void update(true)} />
  </View>;
}
function TopicUnderstanding({ topic }: { topic: CoachTopic }) {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const [intention, setIntention] = useState(topic.intention);
  const [goalIds, setGoalIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setIntention(topic.intention); }, [topic.intention]);
  useEffect(() => {
    let cancelled = false;
    void api.getJson<{goalIds:string[]}>(`/api/coach/topics/${topic.id}/goals`).then(result => { if (!cancelled) setGoalIds(result.goalIds); }).catch(error => { if (!cancelled) coach.setError(error.message); });
    return () => { cancelled = true; };
  }, [topic.id]);
  const update = async (goalId?: string) => {
    setBusy(true);
    try {
      if (goalId) {
        const linked = goalIds?.includes(goalId);
        await api.requestJson({ path: `/api/coach/topics/${topic.id}/goals`, method: linked ? "DELETE" : "POST", body: { goalId } });
        setGoalIds(ids => linked ? (ids ?? []).filter(id => id !== goalId) : [...(ids ?? []), goalId]);
      } else await api.requestJson({ path: `/api/coach/topics/${topic.id}`, method: "PATCH", body: { version: topic.version, intention } });
      await coach.loadBootstrap();
    } catch (error) { coach.setError(error instanceof Error ? error.message : "Could not update understanding."); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 8 }}>
    <Text style={{ color: theme.colors.foreground }}>What this topic is for</Text>
    <TextInput accessibilityLabel="Topic intention" multiline value={intention} onChangeText={setIntention} maxLength={1000} style={{ color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border, padding: 8 }} />
    <PrimaryButton label="Save intention" disabled={busy} onPress={() => void update()} />
    {topic.summary && <Text style={{ color: theme.colors.mutedForeground }}>{topic.summary}\nConversation summary · {topic.summary_sources.length} source messages</Text>}
    {topic.summary_sources.length > 0 && <CoachSources key={topic.summary_sources.join(",")} ids={topic.summary_sources} />}
    <Text style={{ color: theme.colors.mutedForeground }}>Related goals</Text>
    {coach.facts.data?.goals.map(goal => <Pressable key={goal.id} disabled={busy || goalIds === null} accessibilityRole="checkbox" accessibilityState={{ checked: goalIds?.includes(goal.id) ?? false }} onPress={() => void update(goal.id)}><Text style={{ color: theme.colors.foreground }}>{goalIds?.includes(goal.id) ? "✓ " : "○ "}{goal.title}</Text></Pressable>)}
  </View>;
}
export function CoachUnderstanding() {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const topic = coach.bootstrap?.topics.find(topic => topic.id === coach.conversation?.thread.topic_id);
  const [content, setContent] = useState("");
  const [global, setGlobal] = useState(false);
  const [busy, setBusy] = useState(false);
  const remember = async () => {
    setBusy(true);
    try { await api.postJson("/api/coach/memories", { topicId: global ? null : topic?.id ?? null, content, kind: "preference" }); setContent(""); await coach.loadBootstrap(); }
    catch (error) { coach.setError(error instanceof Error ? error.message : "Could not save preference."); }
    finally { setBusy(false); }
  };
  return <View style={{ borderTopWidth: 1, borderColor: theme.colors.border, paddingVertical: 16, gap: 8 }}>
    <Text style={{ color: theme.colors.foreground, fontSize: 18 }}>What we’re understanding</Text>
    {topic && <TopicUnderstanding key={topic.id} topic={topic} />}
    <Text style={{ color: theme.colors.mutedForeground }}>Saved preferences guide conversations. Progress always comes from current app data.</Text>
    {coach.bootstrap?.memories.filter(memory => memory.topic_id === null || memory.topic_id === topic?.id).map(memory => <Memory key={memory.id + memory.content} memory={memory} />)}
    <TextInput accessibilityLabel="New preference" multiline value={content} onChangeText={setContent} maxLength={1000} placeholder="Something to remember…" placeholderTextColor={theme.colors.mutedForeground} style={{ color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border, padding: 8 }} />
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:global}} onPress={() => setGlobal(!global)}><Text style={{ color: theme.colors.foreground }}>{global ? "✓ " : "○ "}Use in all topics</Text></Pressable>
    <PrimaryButton label="Remember preference" disabled={busy || !content.trim()} onPress={() => void remember()} />
  </View>;
}
