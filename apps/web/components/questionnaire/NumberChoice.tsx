type Option = { value: number; label: string };
type Props = {
  options: Option[];
  value: number | undefined;
  onChange: (v: number) => void;
};

export function NumberChoice({ options, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-5 py-4 text-center font-medium transition ${
              selected
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
