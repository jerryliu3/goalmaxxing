import { type ReactNode } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useJourneyPresentationPreference } from "../features/journey/useJourneyPresentation.native";
import { useTheme } from "../theme";

export function Screen({
  title,
  kicker,
  children,
  scroll = true,
  journeyPresentation = null,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  scroll?: boolean;
  journeyPresentation?: Parameters<typeof useJourneyPresentationPreference>[0];
}) {
  const theme = useTheme();
  useJourneyPresentationPreference(journeyPresentation);
  const body = (
    <View style={styles.body}>
      {kicker ? (
        <Text
          style={[
            styles.kicker,
            {
              color: theme.colors.mutedForeground,
              fontFamily: theme.fonts?.sans,
            },
          ]}
        >
          {kicker}
        </Text>
      ) : null}
      <Text
        accessibilityRole="header"
        style={[
          styles.title,
          {
            color: theme.colors.foreground,
            fontFamily: theme.fonts?.display,
          },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView> : body}
    </SafeAreaView>
  );
}

export function SectionKicker({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={[
        styles.kicker,
        {
          color: theme.colors.mutedForeground,
          fontFamily: theme.fonts?.sans,
          marginTop: 8,
        },
      ]}
    >
      {children}
    </Text>
  );
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={[styles.safe, styles.center, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator color={theme.colors.primary} />
      <Text
        style={{
          color: theme.colors.mutedForeground,
          marginTop: 12,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          fontSize: 11,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20 },
  body: { gap: 12, padding: 20, flex: 1 },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: { fontSize: 28, fontWeight: "600" },
});
