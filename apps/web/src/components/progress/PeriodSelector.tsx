import type { TimePeriod } from '@fitness-tracker/shared';

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
            background: value === p.value ? '#4A90E2' : '#e8e8e8',
            color: value === p.value ? '#fff' : '#555',
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
