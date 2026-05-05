import type { PersonalRecord } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

interface RecentPRsListProps {
  records: PersonalRecord[];
}

export function RecentPRsList({ records }: RecentPRsListProps) {
  const { theme } = useTheme();

  if (records.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: theme.colors.surface,
        boxShadow: theme.shadows.sm,
        borderRadius: theme.borderRadius.md,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 12,
          fontSize: 16,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
        }}
      >
        Personal Records
      </h3>
      {records.map((pr, i) => (
        <div
          key={`${pr.exerciseName}-${pr.date}-${i}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            paddingLeft: pr.previousBest !== null ? 12 : 0,
            borderBottom: i < records.length - 1 ? `1px solid ${theme.colors.background}` : 'none',
            borderLeft: pr.previousBest !== null ? `3px solid ${theme.colors.accent}` : 'none',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{pr.exerciseName}</span>
            <span style={{ color: theme.colors.textHint, fontSize: 13, marginLeft: 8 }}>
              {pr.date}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {pr.weight} lbs
            </span>
            {pr.previousBest !== null && (
              <span style={{ color: theme.colors.success, fontSize: 12, marginLeft: 8 }}>
                +{pr.weight - pr.previousBest} lbs
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
