import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { isPlanExpired, isPlanExpiringSoon, getDaysRemainingInPlan } from '@fitness-tracker/shared';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../providers/ThemeProvider';

export function PlanUpdateBanner() {
  const { theme } = useTheme();
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);
  const navigate = useNavigate();

  if (!currentPlan) return null;

  const expired = isPlanExpired(currentPlan);
  const expiringSoon = isPlanExpiringSoon(currentPlan, 1);

  if (!expired && !expiringSoon) return null;

  const daysLeft = getDaysRemainingInPlan(currentPlan);
  const message = expired
    ? "Your plan week has ended. Chat with AI Coach for next week's plan."
    : `Your plan expires ${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}. Plan your next week!`;

  return (
    <div
      style={{
        background: expired
          ? theme.mode === 'dark'
            ? '#3d2e00'
            : '#FFF3E0'
          : theme.mode === 'dark'
            ? '#1b2d3d'
            : '#E3F2FD',
        border: `1px solid ${
          expired
            ? theme.mode === 'dark'
              ? '#8B6914'
              : '#FFCC80'
            : theme.mode === 'dark'
              ? '#2B5F8A'
              : '#90CAF9'
        }`,
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: expired
            ? theme.mode === 'dark'
              ? '#FFB74D'
              : '#E65100'
            : theme.mode === 'dark'
              ? '#64B5F6'
              : '#1565C0',
        }}
      >
        {message}
      </span>
      <button
        onClick={() => navigate('/')}
        style={{
          border: 'none',
          background: expired
            ? theme.mode === 'dark'
              ? '#FFB74D'
              : '#E65100'
            : theme.mode === 'dark'
              ? '#64B5F6'
              : '#1565C0',
          color: expired
            ? theme.mode === 'dark'
              ? '#1E1E1E'
              : 'white'
            : theme.mode === 'dark'
              ? '#1E1E1E'
              : 'white',
          padding: '6px 14px',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Go to Chat
      </button>
    </div>
  );
}
