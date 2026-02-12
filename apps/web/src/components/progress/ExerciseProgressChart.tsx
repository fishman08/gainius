import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ExerciseAnalytics } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

interface ExerciseProgressChartProps {
  analytics: ExerciseAnalytics;
}

export function ExerciseProgressChart({ analytics }: ExerciseProgressChartProps) {
  const { theme } = useTheme();

  if (analytics.dataPoints.length === 0) {
    return <p style={{ color: theme.colors.textHint, textAlign: 'center' }}>No data yet</p>;
  }

  // Aggregate to best weight per date
  const byDate = new Map<string, number>();
  for (const dp of analytics.dataPoints) {
    const existing = byDate.get(dp.date) ?? 0;
    if (dp.weight > existing) byDate.set(dp.date, dp.weight);
  }

  const chartData = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({
      date: new Date(date).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
      weight,
    }));

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
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>
        {analytics.exerciseName} — Weight Over Time
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: theme.colors.textHint }} />
          <YAxis tick={{ fontSize: 12, fill: theme.colors.textHint }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.surfaceBorder}`,
              color: theme.colors.text,
            }}
            labelStyle={{ color: theme.colors.textSecondary }}
            itemStyle={{ color: theme.colors.text }}
            formatter={(value: number | undefined) => [`${value ?? 0} lbs`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={theme.colors.primary}
            strokeWidth={2}
            dot={{ fill: theme.colors.primary, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
