type Option = { value: string; label: string };
type Props = {
  options: Option[];
  value: string | undefined;
  onChange: (v: string) => void;
};

export function SingleChoice({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-5 py-4 text-left transition ${
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
