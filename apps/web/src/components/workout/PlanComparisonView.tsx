import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { clearPlanComparison } from '../../store/slices/workoutSlice';
import type { PlanChange } from '@fitness-tracker/shared';
import { useTheme } from '../../providers/ThemeProvider';

export function PlanComparisonView() {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const comparison = useSelector((state: RootState) => state.workout.planComparison);

  if (!comparison) return null;

  const rowColors: Record<PlanChange['changeType'], string> = {
    added: theme.mode === 'dark' ? '#1b3d1b' : '#E8F5E9',
    removed: theme.mode === 'dark' ? '#3d1b1b' : '#FFEBEE',
    modified: theme.mode === 'dark' ? '#3d2e00' : '#FFF8E1',
    unchanged: theme.mode === 'dark' ? theme.colors.surface : '#FAFAFA',
  };

  const badgeColors: Record<string, string> = {
    added: theme.mode === 'dark' ? '#388E3C' : '#A5D6A7',
    removed: theme.mode === 'dark' ? '#C62828' : '#EF9A9A',
    modified: theme.mode === 'dark' ? '#F9A825' : '#FFE082',
  };

  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h2 style={{ marginTop: 0, textAlign: 'center', color: theme.colors.text }}>
        Week {comparison.oldPlan.weekNumber} → Week {comparison.newPlan.weekNumber}
      </h2>
      <p
        style={{
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        {comparison.oldPlan.startDate} — {comparison.newPlan.endDate}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${theme.colors.surfaceBorder}` }}>
            <th style={{ textAlign: 'left', padding: 8, color: theme.colors.text }}>Exercise</th>
            <th style={{ textAlign: 'center', padding: 8, color: theme.colors.text }}>Old Plan</th>
            <th style={{ textAlign: 'center', padding: 8, color: theme.colors.text }}>New Plan</th>
            <th style={{ textAlign: 'center', padding: 8, color: theme.colors.text }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {comparison.changes.map((change, i) => (
            <tr
              key={i}
              style={{
                background: rowColors[change.changeType],
                borderBottom: `1px solid ${theme.colors.surfaceBorder}`,
              }}
            >
              <td style={{ padding: 8, fontWeight: 500, color: theme.colors.text }}>
                {change.exerciseName}
              </td>
              <td
                style={{
                  padding: 8,
                  textAlign: 'center',
                  color: theme.colors.textSecondary,
                  fontSize: 13,
                }}
              >
                {change.oldValue ?? '—'}
              </td>
              <td
                style={{ padding: 8, textAlign: 'center', color: theme.colors.text, fontSize: 13 }}
              >
                {change.newValue ?? '—'}
              </td>
              <td style={{ padding: 8, textAlign: 'center' }}>
                {change.changeType !== 'unchanged' && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: badgeColors[change.changeType],
                      color: theme.colors.text,
                    }}
                  >
                    {change.changeType === 'added'
                      ? 'New'
                      : change.changeType === 'removed'
                        ? 'Removed'
                        : 'Modified'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {comparison.changes.some((c) => c.details) && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8, color: theme.colors.text }}>Changes Detail</h4>
          {comparison.changes
            .filter((c) => c.details)
            .map((c, i) => (
              <p
                key={i}
                style={{
                  fontSize: 13,
                  color: theme.mode === 'dark' ? '#FFB74D' : '#E65100',
                  margin: '4px 0',
                }}
              >
                {c.exerciseName}: {c.details}
              </p>
            ))}
        </div>
      )}

      {comparison.claudeReasoning && (
        <div
          style={{
            background: theme.mode === 'dark' ? '#1b2d3d' : '#E3F2FD',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: 8, color: theme.colors.text }}>
            AI Coach Reasoning
          </h4>
          <p style={{ fontSize: 14, margin: 0, whiteSpace: 'pre-wrap', color: theme.colors.text }}>
            {comparison.claudeReasoning}
          </p>
        </div>
      )}

      <button
        onClick={() => dispatch(clearPlanComparison())}
        style={{
          width: '100%',
          padding: 12,
          background: theme.colors.primary,
          color: theme.colors.primaryText,
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Accept New Plan
      </button>
    </div>
  );
}
