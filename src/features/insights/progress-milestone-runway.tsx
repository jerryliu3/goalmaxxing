import { defaultMilestoneName } from "@/lib/goals/milestones";

export interface ProgressMilestoneStop {
  name: string;
  date: string | null;
}

export function ProgressMilestoneRunway({
  title,
  countLabel,
  stops,
  activeDate,
  onSelect,
  onNameChange,
  onNameCommit,
}: {
  title: string;
  countLabel: string;
  stops: readonly ProgressMilestoneStop[];
  activeDate?: string | null;
  onSelect?: (stop: ProgressMilestoneStop, index: number) => void;
  onNameChange?: (index: number, name: string) => void;
  onNameCommit?: (index: number, name: string) => void;
}) {
  if (stops.length === 0) {
    return null;
  }

  const canEditNames = Boolean(onNameChange);

  return (
    <section className="rounded-[12px] border border-border p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="type-eyebrow text-[10px] text-muted-foreground">
            Milestone runway
          </p>
          <h2 className="mt-1 type-heading text-lg tracking-tight">
            {title}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">{countLabel}</p>
      </div>
      <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <ol className="flex min-w-max gap-2">
          {stops.map((stop, index) => {
            const name = stop.name.trim() || defaultMilestoneName(index);
            const selected = Boolean(activeDate && stop.date === activeDate);
            return (
              <li key={`${index}-${stop.date ?? "open"}`} className="w-[9.5rem] shrink-0">
                <div
                  className={`flex min-h-[5.5rem] w-full flex-col items-start rounded-[10px] border px-3 py-2 text-left ${
                    selected ? "border-foreground" : "border-border"
                  } ${stop.date ? "bg-muted/50" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect?.(stop, index)}
                    aria-current={selected ? "step" : undefined}
                    className="type-eyebrow text-[10px] text-muted-foreground"
                  >
                    {index + 1} / {stops.length}
                  </button>
                  {canEditNames ? (
                    <input
                      aria-label={`Milestone ${index + 1} name`}
                      value={stop.name}
                      placeholder={defaultMilestoneName(index)}
                      onChange={(event) => onNameChange?.(index, event.target.value)}
                      onBlur={(event) => onNameCommit?.(index, event.currentTarget.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      className="mt-1 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground focus:border-b focus:border-primary"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect?.(stop, index)}
                      aria-current={selected ? "step" : undefined}
                      className="mt-1 text-left text-sm font-semibold"
                    >
                      {name}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect?.(stop, index)}
                    className="text-xs text-muted-foreground"
                  >
                    {stop.date ?? "Unplaced"}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
