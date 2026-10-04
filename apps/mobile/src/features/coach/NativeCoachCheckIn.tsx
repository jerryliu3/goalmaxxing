import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useRouter } from "expo-router";
import { useTheme } from "../../theme";
import { PrimaryButton } from "../../ui/button";
import { useNativeCoach } from "./coach-context";
import { useSession } from "../../lib/session";
import { refreshCoachData } from "./refresh-data";

export function NativeCoachCheckIn() {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const router = useRouter();
  const client = useQueryClient();
  const { userId } = useSession();
  const [saving, setSaving] = useState<string | null>(null);
  const [tab, setTab] = useState<"recap" | "next">("recap");
  const payload = coach.briefing.payload;
  if (!coach.briefing.enabled) return null;
  if (!payload) return <PrimaryButton label="Open current check-in" onPress={() => void coach.briefing.open()} />;
  const window = tab === "recap" ? payload.facts.recap : payload.facts.ahead;
  const text = { color: theme.colors.foreground };
  const complete = async (goalId: string, date: string) => {
    setSaving(`${goalId}:${date}`);
    try {
      await api.postJson("/api/completions", { goalId, date, desiredFactState: "present" });
      if (userId) await refreshCoachData(client, userId);
      await coach.briefing.refresh();
    } catch (error) { coach.setError(error instanceof Error ? error.message : "The completion could not be saved."); }
    finally { setSaving(null); }
  };
  return <View style={{ borderWidth: 1, borderColor: theme.colors.border, padding: 16, borderRadius: 12, marginBottom: 16, gap: 10 }}>
    <Text style={{ ...text, fontFamily: theme.fonts.display, fontSize: 22 }}>{payload.kind} check-in</Text>
    <View style={{ flexDirection: "row", gap: 20 }}>{(["recap", "next"] as const).map(value => <Pressable key={value} onPress={() => setTab(value)}><Text style={{ ...text, fontWeight: tab === value ? "700" : "400" }}>{value === "recap" ? "Recap" : "Next"}</Text></Pressable>)}</View>
    {tab === "next" && <Text style={text}>{payload.suggestions?.motivation ?? (coach.briefing.generating ? "Reading your plan…" : "Start with what’s already on the calendar.")}</Text>}
    <Text style={text}>{window.label} · {window.start} — {window.end}</Text>
    <Text style={text}>{window.completed} of {window.placed} done · {window.estimatedMinutes} minutes remaining</Text>
    {window.items.map(item => <View key={`${item.goalId}:${item.date}`} style={{gap:4}}><Text style={text}>{item.title} · {item.date} · {item.state}</Text>{tab === "recap" && item.state === "open" && <PrimaryButton label={saving === `${item.goalId}:${item.date}` ? "Saving…" : "Mark done"} disabled={saving !== null} onPress={() => void complete(item.goalId,item.date)} />}</View>)}
    {tab === "next" && <>
      {payload.facts.recover.count > 0 && <Text style={text}>{payload.facts.recover.count} sessions to recover</Text>}
      {payload.facts.unscheduled.count > 0 && <Text style={text}>{payload.facts.unscheduled.count} goals need placement</Text>}
      <PrimaryButton label="Open planner" onPress={() => { coach.setOpen(false); router.push("/(tabs)/calendar"); }} />
      {payload.kind === "monthly" && <PrimaryButton label="Create goal" onPress={() => { coach.setOpen(false); router.push("/goals/new"); }} />}
    </>}
    {coach.briefing.error && <Text accessibilityRole="alert" style={text}>{coach.briefing.error}</Text>}
    <PrimaryButton label="Discuss with coach" onPress={() => { if (coach.draft.trim()) { coach.setError("Send or clear your unfinished draft first."); return; } coach.setDraft(`Help me understand my ${payload.kind} check-in and decide what to do next.`, { kind: payload.kind, periodKey: payload.periodKey }); coach.setView("conversation"); }} />
    <PrimaryButton label="Refresh briefing" disabled={coach.briefing.generating} onPress={() => void coach.briefing.refresh(true).catch(error => coach.setError(error.message))} />
    <Pressable onPress={() => coach.setView("conversation")}><Text style={text}>Close check-in</Text></Pressable>
  </View>;
}
