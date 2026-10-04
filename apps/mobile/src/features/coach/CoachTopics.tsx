import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { CoachTopic, CoachThread } from "@cadence/shared/coach";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";
import { PrimaryButton } from "../../ui/button";
import { useNativeCoach } from "./coach-context";

type Editing = { kind: "topic"; entity: CoachTopic } | { kind: "thread"; entity: CoachThread };
function CoachTopicEditor({ editing, close }: { editing: Editing; close: () => void }) {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const [title, setTitle] = useState(editing.entity.title);
  const [busy, setBusy] = useState(false);
  const isDefault = editing.kind === "topic" && editing.entity.is_default;
  const save = async (patch: Record<string, unknown> | null) => {
    setBusy(true);
    try {
      await api.requestJson({ path: `/api/coach/${editing.kind === "topic" ? "topics" : "threads"}/${editing.entity.id}`, method: patch ? "PATCH" : "DELETE", body: { version: editing.entity.version, ...patch } });
      await coach.reload(); close();
    } catch (error) { coach.setError(error instanceof Error ? error.message : "Could not update conversation."); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 8, paddingVertical: 12 }}>
    <TextInput accessibilityLabel="Conversation name" value={title} onChangeText={setTitle} maxLength={120} style={{ color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border, padding: 8 }} />
    <PrimaryButton label="Save name" disabled={busy || !title.trim()} onPress={() => void save({ title })} />
    {!isDefault && <>
      <PrimaryButton label={editing.entity.archived_at ? "Restore" : "Archive"} disabled={busy} onPress={() => void save({ archived: !editing.entity.archived_at })} />
      <PrimaryButton label="Delete" disabled={busy} onPress={() => Alert.alert("Delete conversation history?", editing.kind === "topic" ? "This permanently removes this topic, its conversations, and its topic preferences." : "This permanently removes this conversation. Confirmed preferences are kept.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void save(null) }])} />
    </>}
    <PrimaryButton label="Cancel" disabled={busy} onPress={close} />
  </View>;
}
export function CoachTopics({ selected }: { selected: () => void }) {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const [name, setName] = useState("");
  const [archived, setArchived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const create = async (topicId?: string) => {
    setBusy(true);
    try { await coach.create(topicId ? "thread" : "topic", topicId ? "New conversation" : name.trim(), topicId); setName(""); selected(); }
    catch (error) { coach.setError(error instanceof Error ? error.message : "Could not create conversation."); }
    finally { setBusy(false); }
  };
  return <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
    {coach.bootstrap?.topics.filter(topic => archived || !topic.archived_at).map(topic => <View key={topic.id} style={{ paddingBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
        <Text style={{ color: theme.colors.mutedForeground }}>{topic.title}{topic.archived_at ? " · archived" : ""}</Text>
        <Pressable accessibilityLabel={`Manage ${topic.title}`} onPress={() => setEditing({ kind: "topic", entity: topic })}><Text style={{ color: theme.colors.foreground }}>Manage</Text></Pressable>
      </View>
      {coach.bootstrap?.threads.filter(thread => thread.topic_id === topic.id && (archived || !thread.archived_at)).map(thread => <View key={thread.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
        <Pressable onPress={() => { coach.setThreadId(thread.id); selected(); }}><Text style={{ color: theme.colors.foreground }}>{thread.title}{thread.archived_at ? " · archived" : ""}</Text></Pressable>
        <Pressable accessibilityLabel={`Manage ${thread.title}`} onPress={() => setEditing({ kind: "thread", entity: thread })}><Text style={{ color: theme.colors.mutedForeground }}>Edit</Text></Pressable>
      </View>)}
      {!topic.archived_at && <PrimaryButton label="New conversation" disabled={busy} onPress={() => void create(topic.id)} />}
    </View>)}
    {editing && <CoachTopicEditor key={editing.kind + editing.entity.id} editing={editing} close={() => setEditing(null)} />}
    <TextInput accessibilityLabel="New room" value={name} onChangeText={setName} maxLength={120} placeholder="New room" placeholderTextColor={theme.colors.mutedForeground} style={{ color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border, padding: 8 }} />
    <PrimaryButton label="Create room" disabled={busy || !name.trim()} onPress={() => void create()} />
    <Pressable onPress={() => setArchived(!archived)}><Text style={{ color: theme.colors.mutedForeground, paddingVertical: 12 }}>{archived ? "Hide archived" : "Show archived"}</Text></Pressable>
  </ScrollView>;
}
