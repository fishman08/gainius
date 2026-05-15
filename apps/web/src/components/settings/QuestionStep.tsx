import type { CSSProperties } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import type { Question } from '@fitness-tracker/shared';
import { cmToFeetInches, feetInchesToCm, kgToLbs, lbsToKg } from '@fitness-tracker/shared';

interface Props {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
  imperial: boolean;
  freeTextValue?: string;
  onFreeTextChange?: (fieldKey: string, value: string) => void;
}

export function QuestionStep({
  question,
  value,
  onChange,
  imperial,
  freeTextValue,
  onFreeTextChange,
}: Props) {
  const { theme } = useTheme();

  const chipStyle = (selected: boolean): CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    marginBottom: 8,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${selected ? theme.colors.primary : theme.colors.surfaceBorder}`,
    backgroundColor: selected ? theme.colors.primary : 'transparent',
    color: selected ? theme.colors.primaryText : theme.colors.text,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: theme.typography.label.fontSize,
    fontWeight: selected ? 600 : 400,
    cursor: 'pointer',
    textAlign: 'left',
  });

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: 12,
    border: `1px solid ${theme.colors.inputBorder}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: 16,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    boxSizing: 'border-box',
    fontFamily: theme.typography.body.fontFamily,
  };

  if (question.kind === 'single' || question.kind === 'number_choice') {
    const selected = value as string | number | undefined;
    return (
      <div>
        {question.options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            style={chipStyle(selected === opt.value)}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.kind === 'multi') {
    const selected = (value as string[] | undefined) ?? [];
    const toggle = (v: string) => {
      const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
      onChange(next);
    };
    return (
      <div>
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            style={chipStyle(selected.includes(opt.value))}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        {question.freeTextField && (
          <textarea
            placeholder={question.freeTextLabel ?? 'Additional notes (optional)'}
            value={freeTextValue ?? ''}
            onChange={(e) => onFreeTextChange?.(question.freeTextField!, e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              marginTop: 8,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        )}
      </div>
    );
  }

  if (question.kind === 'date') {
    return (
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="YYYY-MM-DD"
        style={inputStyle}
      />
    );
  }

  if (question.kind === 'measurement') {
    if (question.metric === 'height') {
      if (imperial) {
        const cm = typeof value === 'number' ? value : 0;
        const { ft, inches } = cm > 0 ? cmToFeetInches(cm) : { ft: 0, inches: 0 };
        return (
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="number"
              value={ft > 0 ? ft : ''}
              onChange={(e) => onChange(feetInchesToCm(Number(e.target.value) || 0, inches))}
              placeholder="Feet"
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="number"
              value={inches > 0 ? inches : ''}
              onChange={(e) => onChange(feetInchesToCm(ft, Number(e.target.value) || 0))}
              placeholder="Inches"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        );
      }
      return (
        <input
          type="number"
          value={typeof value === 'number' && value > 0 ? value : ''}
          onChange={(e) => onChange(Number(e.target.value) || undefined)}
          placeholder="Height (cm)"
          style={inputStyle}
        />
      );
    }
    if (question.metric === 'weight') {
      if (imperial) {
        const kg = typeof value === 'number' ? value : 0;
        const lbs = kg > 0 ? kgToLbs(kg) : 0;
        return (
          <input
            type="number"
            value={lbs > 0 ? lbs : ''}
            onChange={(e) => onChange(lbsToKg(Number(e.target.value) || 0))}
            placeholder="Weight (lbs)"
            style={inputStyle}
          />
        );
      }
      return (
        <input
          type="number"
          value={typeof value === 'number' && value > 0 ? value : ''}
          onChange={(e) => onChange(Number(e.target.value) || undefined)}
          placeholder="Weight (kg)"
          style={inputStyle}
        />
      );
    }
  }

  return null;
}
