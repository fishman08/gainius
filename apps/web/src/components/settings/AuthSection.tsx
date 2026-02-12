import { useCallback } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';

export function AuthSection() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  if (!user) return null;

  return (
    <div
      style={{
        background: theme.colors.surface,
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${theme.colors.surfaceBorder}`,
        marginBottom: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 8, color: theme.colors.text }}>Account</h2>
      <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
        Signed in as <strong>{user.email}</strong>
      </p>
      <button
        onClick={handleSignOut}
        style={{
          width: '100%',
          padding: 12,
          backgroundColor: 'transparent',
          color: theme.colors.textSecondary,
          border: `1px solid ${theme.colors.surfaceBorder}`,
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
