type Option = { value: number; label: string };
type Props = {
  options: Option[];
  value: number | undefined;
  onChange: (v: number) => void;
};

export function NumberChoice({ options, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`shadow-sm rounded-lg border px-lg py-md text-center transition ${
              selected
                ? "border-primary bg-primary-muted shadow-md"
                : "border-border bg-surface hover:border-fg-hint"
            }`}
          >
            <span className="display block text-3xl">{option.value}</span>
            <span className="text-fg-secondary text-xs">days</span>
          </button>
        );
      })}
    </div>
  );
}
