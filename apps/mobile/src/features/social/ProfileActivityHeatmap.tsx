import type { PublicProfileHeatmapPoint } from "@cadence/shared/social/public-profile";
import { getGazetteerHeatmapScaleHex } from "@cadence/shared/brand/gazetteer";
import { useMemo } from "react";
import { ScrollView, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useTheme } from "../../theme";

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_CELL_SIZE = 10;
const HEATMAP_CELL_GAP = 2;

interface HeatmapCell {
  key: string;
  x: number;
  y: number;
  count: number;
}

function normalizeYearDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildHeatmapCells({
  year,
  points,
}: {
  year: number;
  points: PublicProfileHeatmapPoint[];
}) {
  const yearStart = new Date(year, 0, 1);
  const firstWeekStart = normalizeYearDate(yearStart);
  firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay());

  const cells: HeatmapCell[] = [];
  let maxWeekIndex = 0;
  for (const point of points) {
    const parsed = new Date(`${point.date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      continue;
    }
    const normalized = normalizeYearDate(parsed);
    const dayDelta = Math.floor(
      (normalized.getTime() - firstWeekStart.getTime()) / DAY_MS
    );
    const weekIndex = Math.floor(dayDelta / 7);
    if (weekIndex < 0) {
      continue;
    }
    maxWeekIndex = Math.max(maxWeekIndex, weekIndex);
    const weekday = normalized.getDay();
    cells.push({
      key: point.date,
      x: weekIndex * (HEATMAP_CELL_SIZE + HEATMAP_CELL_GAP),
      y: weekday * (HEATMAP_CELL_SIZE + HEATMAP_CELL_GAP),
      count: point.count,
    });
  }

  const width =
    (maxWeekIndex + 1) * (HEATMAP_CELL_SIZE + HEATMAP_CELL_GAP) -
    HEATMAP_CELL_GAP;
  const height = 7 * (HEATMAP_CELL_SIZE + HEATMAP_CELL_GAP) - HEATMAP_CELL_GAP;
  return { cells, width: Math.max(width, 0), height: Math.max(height, 0) };
}

export function YearHeatmap({
  points,
  year,
}: {
  points: PublicProfileHeatmapPoint[];
  year: number;
}) {
  const theme = useTheme();
  const model = useMemo(() => buildHeatmapCells({ year, points }), [points, year]);

  if (model.cells.length === 0) {
    return (
      <Text style={{ color: theme.colors.mutedForeground }}>
        No activity yet this year.
      </Text>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 2 }}
    >
      <Svg width={model.width} height={model.height}>
        {model.cells.map((cell) => (
          <Rect
            key={cell.key}
            x={cell.x}
            y={cell.y}
            width={HEATMAP_CELL_SIZE}
            height={HEATMAP_CELL_SIZE}
            rx={2}
            ry={2}
            fill={getGazetteerHeatmapScaleHex(cell.count)}
            stroke={theme.colors.background}
            strokeWidth={0.6}
          />
        ))}
      </Svg>
    </ScrollView>
  );
}
