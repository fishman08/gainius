import { useState, useCallback } from 'react';
import { useAuth } from '../../providers/AuthProvider';

export function AuthSection() {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSuccessMessage('Account created successfully! You can now sign in.');
      setEmail('');
      setPassword('');
    }
    setIsSubmitting(false);
  }, [email, password, signUp]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setEmail('');
    setPassword('');
  }, [signOut]);

  if (isLoading) return null;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #ddd',
        marginBottom: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Cloud Sync Account</h2>
      {user ? (
        <div>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
            Signed in as <strong>{user.email}</strong>
          </p>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: 12,
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
            Sign in or create an account to sync your data across devices.
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
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 12,
              boxSizing: 'border-box' as const,
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
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 12,
              boxSizing: 'border-box' as const,
            }}
          />
          {error && <p style={{ fontSize: 14, color: '#dc3545', marginBottom: 12 }}>{error}</p>}
          {successMessage && (
            <p style={{ fontSize: 14, color: '#28a745', marginBottom: 12 }}>{successMessage}</p>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSignIn}
              disabled={isSubmitting || !email.trim() || !password}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#4A90E2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                opacity: isSubmitting || !email.trim() || !password ? 0.5 : 1,
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={isSubmitting || !email.trim() || !password}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: 'transparent',
                color: '#4A90E2',
                border: '1px solid #4A90E2',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                opacity: isSubmitting || !email.trim() || !password ? 0.5 : 1,
              }}
            >
              {isSubmitting ? 'Creating...' : 'Sign Up'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
