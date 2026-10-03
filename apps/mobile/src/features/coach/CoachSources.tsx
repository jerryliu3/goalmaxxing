import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { z } from "zod";
import { coachMessageSchema, type CoachMessage } from "@cadence/shared/coach";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";
import { useNativeCoach } from "./coach-context";

export function CoachSources({ ids }: { ids: string[] }) {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setOpen(!open);
    if (open || messages || busy) return;
    setBusy(true);
    try { const result = await api.getJson<{messages:unknown}>(`/api/coach/messages?ids=${ids.join(",")}`); setMessages(z.array(coachMessageSchema).parse(result.messages)); }
    catch (error) { coach.setError(error instanceof Error ? error.message : "Sources unavailable."); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 8 }}>
    <Pressable onPress={() => void toggle()}><Text style={{ color: theme.colors.mutedForeground }}>{open ? "Hide sources" : "View source messages"}</Text></Pressable>
    {open && busy && <Text style={{ color: theme.colors.mutedForeground }}>Loading sources…</Text>}
    {open && messages?.map(message => <View key={message.id} style={{ borderLeftWidth: 2, borderColor: theme.colors.border, paddingLeft: 8 }}><Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>{message.role === "user" ? "You" : "Coach"} · {new Date(message.created_at).toLocaleDateString()}</Text><Text style={{ color: theme.colors.foreground }}>{message.content}</Text></View>)}
  </View>;
}
