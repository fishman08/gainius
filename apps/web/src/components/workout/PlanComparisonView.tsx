import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { clearPlanComparison } from '../../store/slices/workoutSlice';
import type { PlanChange } from '@fitness-tracker/shared';

const ROW_COLORS: Record<PlanChange['changeType'], string> = {
  added: '#E8F5E9',
  removed: '#FFEBEE',
  modified: '#FFF8E1',
  unchanged: '#FAFAFA',
};

const CHANGE_LABELS: Record<PlanChange['changeType'], string> = {
  added: 'New',
  removed: 'Removed',
  modified: 'Modified',
  unchanged: '',
};

export function PlanComparisonView() {
  const dispatch = useDispatch();
  const comparison = useSelector((state: RootState) => state.workout.planComparison);

  if (!comparison) return null;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h2 style={{ marginTop: 0, textAlign: 'center' }}>
        Week {comparison.oldPlan.weekNumber} → Week {comparison.newPlan.weekNumber}
      </h2>
      <p style={{ textAlign: 'center', color: '#666', fontSize: 13, marginBottom: 16 }}>
        {comparison.oldPlan.startDate} — {comparison.newPlan.endDate}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Exercise</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Old Plan</th>
            <th style={{ textAlign: 'center', padding: 8 }}>New Plan</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {comparison.changes.map((change, i) => (
            <tr
              key={i}
              style={{ background: ROW_COLORS[change.changeType], borderBottom: '1px solid #eee' }}
            >
              <td style={{ padding: 8, fontWeight: 500 }}>{change.exerciseName}</td>
              <td style={{ padding: 8, textAlign: 'center', color: '#666', fontSize: 13 }}>
                {change.oldValue ?? '—'}
              </td>
              <td style={{ padding: 8, textAlign: 'center', color: '#333', fontSize: 13 }}>
                {change.newValue ?? '—'}
              </td>
              <td style={{ padding: 8, textAlign: 'center' }}>
                {CHANGE_LABELS[change.changeType] && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background:
                        change.changeType === 'added'
                          ? '#A5D6A7'
                          : change.changeType === 'removed'
                            ? '#EF9A9A'
                            : '#FFE082',
                    }}
                  >
                    {CHANGE_LABELS[change.changeType]}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {comparison.changes.some((c) => c.details) && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Changes Detail</h4>
          {comparison.changes
            .filter((c) => c.details)
            .map((c, i) => (
              <p key={i} style={{ fontSize: 13, color: '#E65100', margin: '4px 0' }}>
                {c.exerciseName}: {c.details}
              </p>
            ))}
        </div>
      )}

      {comparison.claudeReasoning && (
        <div style={{ background: '#E3F2FD', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8 }}>AI Coach Reasoning</h4>
          <p style={{ fontSize: 14, margin: 0, whiteSpace: 'pre-wrap' }}>
            {comparison.claudeReasoning}
          </p>
        </div>
      )}

      <button
        onClick={() => dispatch(clearPlanComparison())}
        style={{
          width: '100%',
          padding: 12,
          background: '#4A90E2',
          color: 'white',
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
