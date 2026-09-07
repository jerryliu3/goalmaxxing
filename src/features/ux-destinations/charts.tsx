export function StatStrip({
  items,
}: {
  items: readonly { label: string; value: string; hint?: string }[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-border bg-border sm:grid-cols-4">
      {items.map((item) => (
        <li key={item.label} className="bg-background px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function HeatmapGrid({
  cells,
  caption,
  onSelectDay,
  selectedIndex,
  editable,
  pins,
  pinStyle = "dot",
}: {
  cells: readonly number[];
  caption: string;
  onSelectDay?: (index: number) => void;
  selectedIndex?: number | null;
  editable?: boolean;
  pins?: readonly { cell: number; label: string; mark?: string }[];
  pinStyle?: "dot" | "named";
}) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const pinByCell = new Map((pins ?? []).map((pin) => [pin.cell, pin]));
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((count, index) => {
          const scale = Math.min(4, Math.max(0, count));
          const selected = selectedIndex === index;
          const pin = pinByCell.get(index);
          const className = `relative aspect-square rounded-[3px] heatmap-scale-${scale} ${
            selected ? "ring-2 ring-foreground ring-offset-1" : ""
          } ${onSelectDay ? "min-h-7" : ""}`;
          const pinMark = pin ? (
            pinStyle === "named" ? (
              <span className="absolute inset-x-0 bottom-0 truncate bg-foreground px-0.5 text-center text-[8px] font-semibold leading-3 text-background">
                {pin.mark ?? pin.label.slice(0, 2)}
              </span>
            ) : (
              <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-foreground" />
            )
          ) : null;
          if (onSelectDay) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelectDay(index)}
                aria-label={
                  pin
                    ? `${pin.label} milestone, day ${index + 1}`
                    : `${editable ? "Log or inspect" : "Inspect"} day ${index + 1}, ${count} completions`
                }
                className={className}
              >
                {pinMark}
              </button>
            );
          }
          return (
            <span key={index} className={className}>
              {pinMark}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

export function WeekdayBars({
  data,
}: {
  data: readonly { label: string; percent: number }[];
}) {
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-sm bg-muted">
            <div
              className="w-full rounded-sm bg-primary"
              style={{ height: `${item.percent}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  values,
  label,
}: {
  values: readonly number[];
  label: string;
}) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 46 - (value / max) * 42;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <svg viewBox="0 0 100 48" className="h-28 w-full overflow-visible" aria-hidden>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
          points={points}
          className="text-primary"
        />
      </svg>
    </div>
  );
}

export function CategoryRows({
  data,
}: {
  data: readonly { label: string; percent: number }[];
}) {
  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground">{item.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
