import { Text, View } from "react-native";
import { useTheme } from "../../theme";
import { PrimaryButton } from "../../ui/button";
import { useNativeCoach } from "./coach-context";
import { CoachActionCard } from "./CoachActionCard";
export function CoachChanges() {
  const coach = useNativeCoach()!;
  const theme = useTheme();
  const history = coach.history;
  return <View style={{ gap: 12 }}><Text style={{ color: theme.colors.foreground, fontFamily: theme.fonts.display, fontSize: 24 }}>Changes across your rooms</Text>{history.actions.map(action => <CoachActionCard key={action.id} action={action} />)}{!history.actions.length && !history.loading && <Text style={{ color: theme.colors.mutedForeground }}>Nothing changed yet.</Text>}{history.error && <Text accessibilityRole="alert" style={{ color: theme.colors.foreground }}>{history.error}</Text>}<PrimaryButton label={history.loading ? "Reading changes…" : "Refresh history"} disabled={history.loading} onPress={() => void history.reload()} />{history.next && <PrimaryButton label="Earlier changes" disabled={history.loading} onPress={() => void history.more()} />}</View>;
}
