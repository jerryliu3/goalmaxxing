import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme";
import type { InsightsLedgerGoal } from "./insights-ledger-model";

export function ProgressGoalList({
  goals,
  selectedGoalIds,
  onToggleGoal,
  readOnly = false,
}: {
  goals: InsightsLedgerGoal[];
  selectedGoalIds: ReadonlySet<string>;
  onToggleGoal: (goalId: string) => void;
  readOnly?: boolean;
}) {
  const theme = useTheme();

  if (goals.length === 0) {
    return (
      <Text style={{ color: theme.colors.mutedForeground }}>
        No goals match these controls.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {goals.map((goal) => {
        const selected = selectedGoalIds.has(goal.id);
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={goal.title}
            accessibilityState={{ selected, disabled: readOnly }}
            disabled={readOnly}
            onPress={() => onToggleGoal(goal.id)}
            style={styles.row}
          >
            <View
              style={[
                styles.swatch,
                {
                  borderColor: goal.color,
                  backgroundColor: selected ? goal.color : "transparent",
                },
              ]}
            />
            <Text
              style={{
                color: selected
                  ? theme.colors.foreground
                  : theme.colors.mutedForeground,
                flex: 1,
                fontWeight: "600",
                fontFamily: theme.fonts?.display,
              }}
              numberOfLines={1}
            >
              {goal.title}
            </Text>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontSize: 12,
                fontFamily: theme.fonts?.mono,
              }}
            >
              {goal.rateLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(36,28,20,0.16)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
    paddingVertical: 10,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
