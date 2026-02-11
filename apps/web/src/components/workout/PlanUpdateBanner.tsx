import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { isPlanExpired, isPlanExpiringSoon, getDaysRemainingInPlan } from '@fitness-tracker/shared';
import { useNavigate } from 'react-router-dom';

export function PlanUpdateBanner() {
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
        background: expired ? '#FFF3E0' : '#E3F2FD',
        border: `1px solid ${expired ? '#FFCC80' : '#90CAF9'}`,
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 14, color: expired ? '#E65100' : '#1565C0' }}>{message}</span>
      <button
        onClick={() => navigate('/')}
        style={{
          border: 'none',
          background: expired ? '#E65100' : '#1565C0',
          color: 'white',
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
