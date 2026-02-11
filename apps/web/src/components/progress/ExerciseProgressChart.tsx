import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ExerciseAnalytics } from '@fitness-tracker/shared';

interface ExerciseProgressChartProps {
  analytics: ExerciseAnalytics;
}

export function ExerciseProgressChart({ analytics }: ExerciseProgressChartProps) {
  if (analytics.dataPoints.length === 0) {
    return <p style={{ color: '#999', textAlign: 'center' }}>No data yet</p>;
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
        background: 'white',
        border: '1px solid #e0e0e0',
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
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number | undefined) => [`${value ?? 0} lbs`, 'Weight']} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#4A90E2"
            strokeWidth={2}
            dot={{ fill: '#4A90E2', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
