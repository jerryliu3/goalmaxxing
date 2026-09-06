import { getHeatmapScaleHex } from "@cadence/shared/goals/heatmap";
import type {
  ProgressContextFact,
  ProgressContextSummary,
} from "@cadence/shared/goals/progress-context";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme";
import type { MobileGoal } from "../checklist/checklist-lane-data";
import { summarizeInsightsMonth } from "./insights-lane-data";
import {
  buildInsightsLedgerGoals,
  countFilteredInsightsFactsByDay,
  insightsLedgerDayLabel,
} from "./insights-ledger-model";
import { ProgressGoalList } from "./ProgressGoalList";
import {
  isLedgerHeatmapDayMutable,
  progressLedgerCaption,
  resolveProgressLedgerMode,
  resolveSelectedLedgerGoalIds,
  toggleLedgerGoalSelection,
} from "./progress-ledger-selection";

const WEEKDAY_HEADERS = ["M", "T", "W", "Th", "F", "S", "Su"];

export function InsightsLedgerPanel({
  goals,
  facts,
  summaries,
  days,
  offset,
  readOnly,
  onToggleCompletion,
}: {
  goals: MobileGoal[];
  facts: ProgressContextFact[];
  summaries: ProgressContextSummary[];
  days: string[];
  offset: number;
  readOnly: boolean;
  onToggleCompletion?: (input: {
    goalId: string;
    date: string;
    desiredFactState: "present" | "absent";
  }) => void;
}) {
  const theme = useTheme();
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[] | null>(null);
  const ledgerGoals = useMemo(
    () => buildInsightsLedgerGoals({ goals, facts, summaries }),
    [facts, goals, summaries]
  );
  const visibleGoalIds = ledgerGoals.map((goal) => goal.id);
  const selectedIds = resolveSelectedLedgerGoalIds(visibleGoalIds, selectedGoalIds);
  const selectedIdSet = new Set(selectedIds);
  const mode = resolveProgressLedgerMode({
    selectedCount: selectedIds.length,
    visibleCount: visibleGoalIds.length,
  });
  const factsByDay = countFilteredInsightsFactsByDay(facts, selectedIds);
  const monthSummary = summarizeInsightsMonth(factsByDay);
  const today = format(new Date(), "yyyy-MM-dd");
  const canEdit = !readOnly && mode === "edit" && Boolean(onToggleCompletion);
  const editGoalId = canEdit ? selectedIds[0] : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryRow}>
        <SummaryCard label="Activities" value={monthSummary.totalActivities} />
        <SummaryCard label="Active days" value={monthSummary.activeDays} />
        <SummaryCard label="Best day" value={monthSummary.peakDayActivities} />
      </View>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontSize: 12,
          fontFamily: theme.fonts.sans,
        }}
      >
        {progressLedgerCaption(mode, selectedIds.length)}
      </Text>
      {mode === "empty" ? null : (
        <LedgerMonthHeatmap
          days={days}
          offset={offset}
          factsByDay={factsByDay}
          today={today}
          editGoalId={editGoalId}
          facts={facts}
          onToggleCompletion={onToggleCompletion}
        />
      )}
      <ProgressGoalList
        goals={ledgerGoals}
        selectedGoalIds={selectedIdSet}
        readOnly={readOnly}
        onToggleGoal={(goalId) => {
          setSelectedGoalIds(
            toggleLedgerGoalSelection(visibleGoalIds, selectedGoalIds, goalId)
          );
        }}
      />
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.summaryCard,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
      ]}
    >
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontSize: 12,
          fontFamily: theme.fonts.sans,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors.foreground,
          fontWeight: "700",
          fontFamily: theme.fonts.mono,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function LedgerMonthHeatmap({
  days,
  offset,
  factsByDay,
  today,
  editGoalId,
  facts,
  onToggleCompletion,
}: {
  days: string[];
  offset: number;
  factsByDay: Record<string, number>;
  today: string;
  editGoalId: string | null;
  facts: ProgressContextFact[];
  onToggleCompletion?: (input: {
    goalId: string;
    date: string;
    desiredFactState: "present" | "absent";
  }) => void;
}) {
  const theme = useTheme();

  return (
    <View testID="insights-ledger-heatmap" style={styles.heatmap}>
      {WEEKDAY_HEADERS.map((label) => (
        <Text
          key={label}
          style={[
            styles.heatmapHeader,
            {
              color: theme.colors.mutedForeground,
              fontFamily: theme.fonts.sans,
            },
          ]}
        >
          {label}
        </Text>
      ))}
      {Array.from({ length: offset }, (_, index) => (
        <View key={`pad-${index}`} style={styles.heatmapCell} />
      ))}
      {days.map((date) => {
        const count = factsByDay[date] ?? 0;
        const mutable = Boolean(
          editGoalId && isLedgerHeatmapDayMutable(date, today)
        );
        const isToday = date === today;
        const fill = getHeatmapScaleHex(count);
        const label = insightsLedgerDayLabel(date, count);
        const cell = (
          <View
            style={[
              styles.heatmapFill,
              {
                backgroundColor: fill,
                borderColor: isToday ? theme.colors.foreground : theme.colors.border,
                borderWidth: isToday ? 1 : StyleSheet.hairlineWidth,
                opacity: !editGoalId || mutable ? 1 : 0.45,
              },
            ]}
          >
            <Text
              style={{
                color:
                  count >= 3
                    ? theme.colors.primaryForeground
                    : theme.colors.foreground,
                fontSize: 11,
                fontFamily: theme.fonts.mono,
              }}
            >
              {date.slice(8)}
            </Text>
          </View>
        );

        if (!mutable || !editGoalId) {
          return (
            <View
              key={date}
              style={styles.heatmapCell}
              accessibilityLabel={label}
              testID={`insights-ledger-day-${date}`}
            >
              {cell}
            </View>
          );
        }

        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityLabel={label}
            testID={`insights-ledger-day-${date}`}
            onPress={() => {
              const present = facts.some(
                (fact) =>
                  fact.goal_id === editGoalId && fact.completed_on === date
              );
              onToggleCompletion?.({
                goalId: editGoalId,
                date,
                desiredFactState: present ? "absent" : "present",
              });
            }}
            style={styles.heatmapCell}
          >
            {cell}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  heatmapHeader: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 10,
    paddingBottom: 4,
  },
  heatmapCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  heatmapFill: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
