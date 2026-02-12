import type { TimePeriod } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

interface PeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const periods: { label: string; value: TimePeriod }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'All', value: 'all' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: 20,
            background: value === p.value ? theme.colors.primary : theme.colors.surfaceBorder,
            color: value === p.value ? theme.colors.primaryText : theme.colors.textSecondary,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
