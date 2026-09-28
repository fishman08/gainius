import { useTheme } from '../../providers/ThemeProvider';

interface PresetProgramCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onStart: () => void;
}

export function PresetProgramCard({
  title,
  description,
  actionLabel,
  onStart,
}: PresetProgramCardProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: theme.borderRadius.md,
        padding: 20,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.text, marginBottom: 4 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
      <button
        onClick={onStart}
        style={{
          width: '100%',
          padding: '12px 0',
          background: theme.colors.primary,
          color: theme.colors.primaryText,
          border: 'none',
          borderRadius: theme.borderRadius.sm,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
