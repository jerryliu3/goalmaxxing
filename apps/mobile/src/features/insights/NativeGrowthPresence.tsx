import { useQuery } from "@tanstack/react-query";
import { Text, View, ScrollView } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useSession } from "../../lib/session";
import { useTheme } from "../../theme";
import { SectionKicker } from "../../ui/screen";
import { duoQueryKeys } from "../duo/query-keys";
import { fetchMobilePublicProfile } from "../social/public-profile";
import { YearHeatmap } from "../social/ProfileActivityHeatmap";

export function NativeGrowthPresence({ userId, section }: {
  userId: string | null;
  section: "score-medals" | "stats";
}) {
  const theme = useTheme();
  const { userId: viewerUserId } = useSession();
  const year = new Date().getFullYear();
  const query = useQuery({
    queryKey: [...duoQueryKeys.insightsPrefix(viewerUserId), "presence", userId, year],
    enabled: Boolean(userId),
    queryFn: () => fetchMobilePublicProfile({ subjectUserId: userId!, year }),
  });
  if (query.isPending) {
    return <Text style={{ color: theme.colors.mutedForeground }}>Loading Growth…</Text>;
  }
  if (query.error || !query.data) {
    return <Text accessibilityRole="alert" style={{ color: theme.colors.mutedForeground }}>{query.error?.message ?? "Growth unavailable."}</Text>;
  }

  const bundle = query.data;
  const textStyle = { color: theme.colors.foreground, fontFamily: theme.fonts.sans };
  if (section === "stats") {
    return (
      <View style={{ gap: 12 }}>
        <SectionKicker>Stats</SectionKicker>
        {bundle.overallStats ? (
          <View style={{ gap: 8 }}>
            <Text style={textStyle}>Total activities: {bundle.overallStats.totalActivities}</Text>
            <Text style={textStyle}>Goals completed: {bundle.overallStats.totalGoalsCompleted}</Text>
            <Text style={textStyle}>Today: {bundle.overallStats.todayActivities}</Text>
            <Text style={textStyle}>This week: {bundle.overallStats.currentWeekActivities.current}</Text>
            <Text style={textStyle}>This month: {bundle.overallStats.currentMonthActivities.current}</Text>
            <Text style={textStyle}>Active streak: {bundle.overallStats.activeStreakWeeks} weeks</Text>
          </View>
        ) : null}
        <YearHeatmap points={bundle.yearHeatmap} year={year} />
      </View>
    );
  }

  const max = Math.max(1, ...bundle.growSeries.map(point => point.score));
  const points = bundle.growSeries.map((point, index) =>
    `${index / Math.max(1, bundle.growSeries.length - 1) * 300},${88 - point.score / max * 80}`
  ).join(" ");
  const earned = bundle.globalAchievements.filter(award => !award.revokedAt);
  return (
    <View style={{ gap: 12 }}>
      <SectionKicker>Goal score</SectionKicker>
      <Text style={textStyle}>{bundle.growSeries.at(-1)?.score.toFixed(1) ?? "0.0"}</Text>
      <Svg width="100%" height={100} viewBox="0 0 300 100" accessibilityLabel="Goal score over the last 4 weeks">
        <Polyline points={points} fill="none" stroke={theme.colors.primary} strokeWidth={2} />
      </Svg>
      <SectionKicker>Medals</SectionKicker>
      <ScrollView horizontal contentContainerStyle={{ gap: 12 }}>
        {earned.length ? earned.map(award => (
          <View key={award.id} style={{ borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 12 }}>
            <Text style={textStyle}>Lv {award.level}</Text>
            <Text style={textStyle}>{award.title}</Text>
          </View>
        )) : <Text style={textStyle}>No medals yet.</Text>}
      </ScrollView>
    </View>
  );
}
