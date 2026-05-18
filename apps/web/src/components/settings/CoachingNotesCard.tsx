import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { setCoachingNotes } from '../../store/slices/syncSlice';
import type { RootState, AppDispatch } from '../../store';

export function CoachingNotesCard() {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user, supabase } = useAuth();
  const coachingNotes = useSelector((state: RootState) => state.sync.coachingNotes);

  async function handleReset() {
    if (!supabase || !user?.id) return;
    await supabase.from('profiles').update({ coaching_notes: null }).eq('user_id', user.id);
    dispatch(setCoachingNotes(null));
  }

  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "'Rethink Sans', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: theme.colors.text,
          }}
        >
          Coaching insights
        </span>
        {coachingNotes && (
          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.textSecondary,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Reset coaching notes"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <p
        style={{
          fontFamily: "'Rethink Sans', sans-serif",
          fontSize: 14,
          color: coachingNotes ? theme.colors.text : theme.colors.textSecondary,
          margin: 0,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {coachingNotes ?? 'No insights yet. Chat more to build personalized coaching notes.'}
      </p>
    </div>
  );
}
