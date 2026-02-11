import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeeklyVolume } from '@fitness-tracker/shared';

interface VolumeChartProps {
  data: WeeklyVolume[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return <p style={{ color: '#999', textAlign: 'center' }}>No volume data yet</p>;
  }

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
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Weekly Volume (lbs)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined) => [
              `${(value ?? 0).toLocaleString()} lbs`,
              'Volume',
            ]}
          />
          <Bar dataKey="volume" fill="#4A90E2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
