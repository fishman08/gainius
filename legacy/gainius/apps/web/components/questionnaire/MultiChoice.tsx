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
    } else if (v === "none") {
      onChange(["none"]);
    } else {
      onChange([...value.filter((x) => x !== "none"), v]);
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`shadow-sm flex items-center justify-between rounded-lg border px-lg py-md text-left transition ${
                selected
                  ? "border-primary bg-primary-muted shadow-md"
                  : "border-border bg-surface hover:border-fg-hint"
              }`}
            >
              <span className="font-medium">{option.label}</span>
              <span
                className={`ml-md inline-flex size-5 items-center justify-center rounded-sm border ${
                  selected
                    ? "border-primary bg-primary text-primary-text"
                    : "border-fg-hint"
                }`}
                aria-hidden
              >
                {selected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.5L4.5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {freeTextLabel && onChangeFreeText && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-secondary text-xs uppercase tracking-wider">
            {freeTextLabel}
          </span>
          <textarea
            value={freeTextValue ?? ""}
            onChange={(e) => onChangeFreeText(e.target.value)}
            rows={3}
            maxLength={500}
            className="border-input-border bg-input-bg text-fg focus:border-primary rounded-md border px-md py-md text-base outline-none"
          />
        </label>
      )}
    </div>
  );
}
