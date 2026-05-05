type Props = { current: number; total: number };

export function ProgressBar({ current, total }: Props) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="space-y-2">
      <div className="text-muted flex justify-between text-xs">
        <span>
          Question {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
