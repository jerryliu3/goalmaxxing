export const heatmapScaleHex = [
  "#EBEDF0",
  "#C5DDF7",
  "#7EACE6",
  "#0F64BF",
  "#0A458C",
] as const;

export function getHeatmapScaleIndex(count: number) {
  if (count <= 0) {
    return 0;
  }
  if (count === 1) {
    return 1;
  }
  if (count === 2) {
    return 2;
  }
  if (count === 3) {
    return 3;
  }
  return 4;
}

export function getHeatmapScaleHex(count: number) {
  return heatmapScaleHex[getHeatmapScaleIndex(count)];
}
