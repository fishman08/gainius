type Option = { value: string; label: string };
type Props = {
  options: Option[];
  value: string | undefined;
  onChange: (v: string) => void;
};

export function SingleChoice({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-sm">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`shadow-sm rounded-lg border px-lg py-md text-left transition ${
              selected
                ? "border-primary bg-primary-muted text-fg shadow-md"
                : "border-border bg-surface hover:border-fg-hint"
            }`}
          >
            <span className="text-base font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
