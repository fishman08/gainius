import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useAuth } from '../../providers/AuthProvider';

export default function AuthSection() {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    if (err) setError(err);
    setIsSubmitting(false);
  }, [email, password, signIn]);

  const handleSignUp = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    const { error: err } = await signUp(email.trim(), password);
    if (err) setError(err);
    else setError('');
    setIsSubmitting(false);
  }, [email, password, signUp]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setEmail('');
    setPassword('');
  }, [signOut]);

  if (isLoading) return null;

  return (
    <Card style={styles.card}>
      <Card.Title title="Cloud Sync Account" />
      <Card.Content>
        {user ? (
          <View>
            <Text variant="bodyMedium" style={styles.hint}>
              Signed in as {user.email}
            </Text>
            <Button mode="outlined" onPress={handleSignOut}>
              Sign Out
            </Button>
          </View>
        ) : (
          <View>
            <Text variant="bodyMedium" style={styles.hint}>
              Sign in or create an account to sync your data across devices.
            </Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttons}>
              <Button
                mode="contained"
                onPress={handleSignIn}
                loading={isSubmitting}
                disabled={isSubmitting || !email.trim() || !password}
                style={styles.button}
              >
                Sign In
              </Button>
              <Button
                mode="outlined"
                onPress={handleSignUp}
                loading={isSubmitting}
                disabled={isSubmitting || !email.trim() || !password}
                style={styles.button}
              >
                Sign Up
              </Button>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  hint: { marginBottom: 12, color: '#666' },
  input: { marginBottom: 12 },
  error: { color: '#dc3545', fontSize: 14, marginBottom: 12 },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1 },
});
