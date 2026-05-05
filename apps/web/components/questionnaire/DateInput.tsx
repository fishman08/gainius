type Props = {
  value: string | undefined;
  onChange: (v: string) => void;
};

export function DateInput({ value, onChange }: Props) {
  const today = new Date();
  const max = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate(),
  )
    .toISOString()
    .slice(0, 10);
  const min = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate(),
  )
    .toISOString()
    .slice(0, 10);

  return (
    <input
      type="date"
      value={value ?? ""}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className="text-text w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
    />
  );
}
