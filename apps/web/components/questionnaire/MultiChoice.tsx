type Option = { value: string; label: string };
type Props = {
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  freeTextLabel?: string;
  freeTextValue?: string;
  onChangeFreeText?: (v: string) => void;
};

export function MultiChoice({
  options,
  value,
  onChange,
  freeTextLabel,
  freeTextValue,
  onChangeFreeText,
}: Props) {
  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      // Selecting "none" clears everything else; selecting anything else removes "none".
      if (v === "none") {
        onChange(["none"]);
      } else {
        onChange([...value.filter((x) => x !== "none"), v]);
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`flex items-center justify-between rounded-xl border px-5 py-3 text-left transition ${
                selected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-muted"
              }`}
            >
              <span>{option.label}</span>
              <span
                className={`ml-3 inline-block size-5 rounded border ${
                  selected
                    ? "border-accent bg-accent"
                    : "border-muted bg-transparent"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      {freeTextLabel && onChangeFreeText && (
        <label className="text-muted mt-2 flex flex-col gap-1 text-sm">
          {freeTextLabel}
          <textarea
            value={freeTextValue ?? ""}
            onChange={(e) => onChangeFreeText(e.target.value)}
            rows={3}
            maxLength={500}
            className="text-text rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          />
        </label>
      )}
    </div>
  );
}
