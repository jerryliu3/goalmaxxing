import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme";
import type { InsightsLedgerGoal } from "./insights-ledger-model";

export function ProgressGoalList({
  goals,
  selectedGoalIds,
  onToggleGoal,
  onSelectOnly,
  onSelectAll,
  onClearAll,
  readOnly = false,
}: {
  goals: InsightsLedgerGoal[];
  selectedGoalIds: ReadonlySet<string>;
  onToggleGoal: (goalId: string) => void;
  onSelectOnly?: (goalId: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
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

  const showListActions = !readOnly && Boolean(onSelectAll || onClearAll);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text
          style={{
            color: theme.colors.foreground,
            fontWeight: "700",
            fontFamily: theme.fonts.display,
            fontSize: 14,
          }}
        >
          Goals ({selectedGoalIds.size})
        </Text>
        {showListActions ? (
          <View style={styles.headerActions}>
            {onSelectAll ? (
              <Pressable accessibilityRole="button" onPress={onSelectAll}>
                <Text
                  style={{
                    color: theme.colors.mutedForeground,
                    fontSize: 12,
                    fontWeight: "600",
                    fontFamily: theme.fonts.sansMedium,
                  }}
                >
                  Select all
                </Text>
              </Pressable>
            ) : null}
            {onClearAll ? (
              <Pressable accessibilityRole="button" onPress={onClearAll}>
                <Text
                  style={{
                    color: theme.colors.mutedForeground,
                    fontSize: 12,
                    fontWeight: "600",
                    fontFamily: theme.fonts.sansMedium,
                  }}
                >
                  Clear all
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.list}>
        {goals.map((goal) => {
          const selected = selectedGoalIds.has(goal.id);
          return (
            <View key={goal.id} style={styles.rowWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={goal.title}
                accessibilityState={{ selected, disabled: readOnly }}
                disabled={readOnly}
                onPress={() => onToggleGoal(goal.id)}
                style={[
                  styles.row,
                  selected && {
                    backgroundColor: `${theme.colors.primary}26`,
                    borderColor: `${theme.colors.primary}66`,
                  },
                ]}
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
                    fontFamily: theme.fonts.display,
                  }}
                  numberOfLines={1}
                >
                  {goal.title}
                </Text>
                <Text
                  style={{
                    color: theme.colors.mutedForeground,
                    fontSize: 12,
                    fontFamily: theme.fonts.mono,
                  }}
                >
                  {goal.rateLabel}
                </Text>
              </Pressable>
              {!readOnly && onSelectOnly ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Only ${goal.title}`}
                  onPress={() => onSelectOnly(goal.id)}
                  style={styles.onlyButton}
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 11,
                      fontWeight: "700",
                      fontFamily: theme.fonts.sansMedium,
                    }}
                  >
                    Only
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(36,28,20,0.16)",
  },
  rowWrap: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    borderRadius: 10,
  },
  onlyButton: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
