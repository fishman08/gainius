type Props = { current: number; total: number };

export function ProgressBar({ current, total }: Props) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="space-y-sm">
      <div className="text-fg-secondary flex justify-between text-xs">
        <span className="overline">
          Question {current} of {total}
        </span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="bg-surface border-border h-2 w-full overflow-hidden rounded-full border">
        <div
          className="bg-gradient h-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
