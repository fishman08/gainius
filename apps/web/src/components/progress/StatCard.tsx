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
        background: theme.colors.surfaceElevated,
        boxShadow: theme.shadows.md,
        borderRadius: theme.borderRadius.md,
        padding: '20px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: theme.colors.textHint, marginTop: 4 }}>{label}</div>
    </div>
  );
}
