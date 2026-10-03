import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { coachContextSummary } from "@cadence/shared/coach/context-summary";
import { CoachMessages } from "./CoachMessages";
import { CoachTopics } from "./CoachTopics";
import { CoachUnderstanding } from "./CoachUnderstanding";
import { CoachChanges } from "./CoachChanges";
import { useTheme } from "../../theme";
import { PrimaryButton } from "../../ui/button";
import { NativeCoachCheckIn } from "./NativeCoachCheckIn";
import { useNativeCoach } from "./coach-context";

export function CoachSurface() {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const inset = useSafeAreaInsets();
  const totals = coach.facts.data ? coachContextSummary(coach.facts.data) : null;
  const archived = Boolean(coach.conversation?.thread.archived_at || coach.bootstrap?.topics.find(topic => topic.id === coach.conversation?.thread.topic_id)?.archived_at);
  const text = { color: theme.colors.foreground };
  const muted = { color: theme.colors.mutedForeground, fontSize: 12 };
  if (!coach.open) return null;
  return <Modal visible animationType="slide" transparent={!coach.full} onRequestClose={() => coach.full ? coach.setFull(false) : coach.setOpen(false)}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: coach.full ? theme.colors.background : "rgba(0,0,0,0.15)" }}>
      <View style={{ height: coach.full ? "100%" : "85%", paddingTop: coach.full ? inset.top : 12, paddingBottom: inset.bottom + 12, backgroundColor: theme.colors.background, borderTopLeftRadius: coach.full ? 0 : 24, borderTopRightRadius: coach.full ? 0 : 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}><Text style={{ ...text, fontFamily: theme.fonts.display, fontSize: 24 }}>Companion</Text><View style={{ flexDirection: "row", gap: 16 }}><Pressable accessibilityLabel="Expand or contract coach" onPress={() => coach.setFull(!coach.full)}><Text style={text}>{coach.full ? "Companion" : "Expand"}</Text></Pressable><Pressable accessibilityLabel="Minimize coach" onPress={() => coach.setOpen(false)}><Text style={text}>Close</Text></Pressable></View></View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}><Text style={muted}>{coach.page.surface} · {totals ? `${totals.today.completed}/${totals.today.scheduled} today · ${totals.week.completed}/${totals.week.scheduled} week` : "Reading current facts…"}{coach.facts.isError ? " · Outdated" : coach.facts.isFetching ? " · Refreshing" : ""}</Text>{totals?.selected && <Text style={muted}>Looking at {totals.selected.title}</Text>}</View>
        <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 20, paddingHorizontal: 16, paddingBottom: 16 }}>{(["conversation", "rooms", "check-in", "understanding", "changes"] as const).filter(view => view !== "check-in" || coach.briefing.enabled).map(view => <Pressable key={view} onPress={() => { coach.setView(view); if (view === "check-in") void coach.briefing.open(); }}><Text style={{ ...text, fontWeight: coach.view === view ? "700" : "400" }}>{view === "check-in" ? "Check-in" : view[0].toUpperCase() + view.slice(1)}</Text></Pressable>)}</ScrollView>
        {coach.error && <View style={{ paddingHorizontal: 16 }}><Text accessibilityRole="alert" style={text}>{coach.error}</Text><PrimaryButton label="Reload" onPress={() => void coach.reload().then(() => coach.setError(null)).catch(error => coach.setError(error.message))}/></View>}
        {coach.view === "rooms" ? <CoachTopics selected={() => coach.setView("conversation")} /> : <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
          {coach.view === "conversation" && <><Text style={{ ...muted, marginBottom: 16 }}>{coach.conversation?.thread.title ?? "My week"}</Text>{coach.conversation && !coach.conversation.messages.length && <View style={{ gap: 12, marginBottom: 24 }}><Text style={{ ...text, fontFamily: theme.fonts.display, fontSize: 28 }}>A little perspective. A little room.</Text><Text style={muted}>Ask about today, work through a decision, or adjust your week.</Text>{["How is my week going?", "Make today a little lighter."].map(question => <PrimaryButton key={question} label={question} disabled={Boolean(coach.draft.trim())} onPress={() => coach.setDraft(question)} />)}</View>}<CoachMessages /></>}
          {coach.view === "check-in" && <NativeCoachCheckIn />}
          {coach.view === "understanding" && <CoachUnderstanding key={coach.conversation?.thread.topic_id} />}
          {coach.view === "changes" && <CoachChanges />}
        </ScrollView>}
        {coach.view === "conversation" && <View style={{ paddingHorizontal: 16 }}>{coach.busy && <PrimaryButton label="Stop response" onPress={() => void coach.stop().catch(error => coach.setError(error.message))} />}{archived && <Text style={muted}>Restore this conversation or room to continue.</Text>}<TextInput accessibilityLabel="Message your coach" editable={Boolean(coach.conversation) && !archived} multiline value={coach.draft} onChangeText={coach.setDraft} maxLength={12000} placeholder="Ask, reflect, or make a little room…" placeholderTextColor={theme.colors.mutedForeground} style={{ ...text, minHeight: 70, maxHeight: 130, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12 }} /><PrimaryButton label={coach.busy ? "Thinking…" : "Send"} disabled={archived || coach.busy || !coach.conversation || !coach.draft.trim()} onPress={() => void coach.send()} />{!archived && !coach.busy && coach.conversation?.runs[0] && ["failed", "cancelled"].includes(coach.conversation.runs[0].status) && <PrimaryButton label="Retry saved message" onPress={() => void coach.send(true)} />}</View>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
