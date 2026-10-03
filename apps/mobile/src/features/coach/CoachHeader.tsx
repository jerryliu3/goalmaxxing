import { Pressable, Text, View } from "react-native";
import { PrimaryButton } from "../../ui/button";
import { useTheme } from "../../theme";
import { useNativeCoach } from "./coach-context";
export function CoachHeader() {
  const coach = useNativeCoach();
  const theme = useTheme();
  if (!coach) return null;
  return <Pressable accessibilityLabel="Open your coach" accessibilityRole="button" onPress={() => coach.setOpen(true)} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: theme.colors.foreground }}>Coach{coach.briefing.offered || coach.busy ? " ·" : ""}</Text></Pressable>;
}

export function NativeCoachCheckInInvitation() {
  const coach = useNativeCoach();
  const theme = useTheme();
  if (!coach?.briefing.offered || coach.open) return null;
  return <View style={{ padding: 16, borderRadius: 16, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, gap: 8 }}>
    <Text style={{ color: theme.colors.foreground }}>Your {coach.briefing.offered.kind} check-in</Text>
    <PrimaryButton label="Open" onPress={() => { coach.setView("check-in"); coach.setOpen(true); void coach.briefing.open(); }} />
    <Pressable onPress={coach.briefing.skip}><Text style={{ color: theme.colors.mutedForeground }}>Skip</Text></Pressable>
  </View>;
}
