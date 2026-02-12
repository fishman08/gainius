import { useState, useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = isSubmitting || !email.trim() || !password;

  const handleSignIn = useCallback(async () => {
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    if (err) setError(err);
    setIsSubmitting(false);
  }, [email, password, signIn]);

  const handleSignUp = useCallback(async () => {
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    const { error: err } = await signUp(email.trim(), password);
    if (err) {
      setError(err);
    } else {
      setSuccessMessage('Account created! You can now sign in.');
      setEmail('');
      setPassword('');
    }
    setIsSubmitting(false);
  }, [email, password, signUp]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        padding: 16,
      }}
    >
      <div
        style={{
          background: theme.colors.surface,
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginTop: 0,
            marginBottom: 4,
            fontSize: 28,
            color: theme.colors.text,
          }}
        >
          Gainius
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: theme.colors.textSecondary,
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          Sign in to access your AI-powered fitness tracker.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSuccessMessage('');
          }}
          placeholder="Email"
          style={{
            width: '100%',
            padding: 12,
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 8,
            fontSize: 16,
            marginBottom: 12,
            boxSizing: 'border-box' as const,
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.text,
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setSuccessMessage('');
          }}
          placeholder="Password"
          style={{
            width: '100%',
            padding: 12,
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 8,
            fontSize: 16,
            marginBottom: 12,
            boxSizing: 'border-box' as const,
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.text,
          }}
        />

        {error && (
          <p style={{ fontSize: 14, color: theme.colors.error, marginBottom: 12 }}>{error}</p>
        )}
        {successMessage && (
          <p style={{ fontSize: 14, color: theme.colors.success, marginBottom: 12 }}>
            {successMessage}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSignIn}
            disabled={disabled}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryText,
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={disabled}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: 'transparent',
              color: theme.colors.primary,
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {isSubmitting ? 'Creating...' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
