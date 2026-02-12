import { useTheme } from '../../providers/ThemeProvider';

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: 12,
        padding: '20px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.text }}>{value}</div>
      <div style={{ fontSize: 13, color: theme.colors.textHint, marginTop: 4 }}>{label}</div>
    </div>
  );
}
