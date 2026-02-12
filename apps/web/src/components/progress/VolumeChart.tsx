import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeeklyVolume } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

interface VolumeChartProps {
  data: WeeklyVolume[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  const { theme } = useTheme();

  if (data.length === 0) {
    return <p style={{ color: theme.colors.textHint, textAlign: 'center' }}>No volume data yet</p>;
  }

  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Weekly Volume (lbs)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: theme.colors.textHint }} />
          <YAxis tick={{ fontSize: 12, fill: theme.colors.textHint }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              color: theme.colors.text,
            }}
            labelStyle={{ color: theme.colors.textSecondary }}
            itemStyle={{ color: theme.colors.text }}
            formatter={(value: number | undefined) => [
              `${(value ?? 0).toLocaleString()} lbs`,
              'Volume',
            ]}
          />
          <Bar dataKey="volume" fill={theme.colors.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
