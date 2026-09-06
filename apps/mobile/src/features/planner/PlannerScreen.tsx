import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarScreen } from "../calendar/CalendarScreen";
import { ChecklistScreen } from "../checklist/ChecklistScreen";
import { useTheme } from "../../theme";

type PlannerSurface = "calendar" | "checklist";

const SURFACE_OPTIONS: Array<{ key: PlannerSurface; label: string }> = [
  { key: "checklist", label: "Day" },
  { key: "calendar", label: "Month" },
];

export function PlannerScreen() {
  const params = useLocalSearchParams<{ surface?: string }>();
  const [surface, setSurface] = useState<PlannerSurface>(
    params.surface === "calendar" ? "calendar" : "checklist"
  );
  const theme = useTheme();
  const navigation = (
    <View style={styles.tabs}>
      {SURFACE_OPTIONS.map((option) => {
        const selected = surface === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={styles.tab}
            onPress={() => setSurface(option.key)}
          >
            <Text
              style={{
                color: selected
                  ? theme.colors.primary
                  : theme.colors.mutedForeground,
                fontWeight: selected ? "700" : "600",
                letterSpacing: 1.4,
                textTransform: "uppercase",
                fontSize: 11,
                fontFamily: theme.fonts?.sans,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return surface === "calendar" ? (
    <CalendarScreen plannerNavigation={navigation} />
  ) : (
    <ChecklistScreen plannerNavigation={navigation} />
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 16,
  },
  tab: {
    minHeight: 44,
    justifyContent: "center",
  },
});
