export function TeamXpSummary({ totalXp }: { totalXp: number }) {
  return (
    <div className="rounded-lg border border-secondary/30 bg-day-selected p-3">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Team XP</p>
      <p className="font-mono text-xl font-semibold">{totalXp.toLocaleString()} XP</p>
      <p className="text-xs text-muted-foreground">
        Earned together since the team formed
      </p>
    </div>
  );
}
