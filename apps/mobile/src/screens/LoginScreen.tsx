import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../providers/AuthProvider';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const { error: err } = await signIn(email.trim(), password);
      if (err) setError(err);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, signIn]);

  const handleSignUp = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const { error: err } = await signUp(email.trim(), password);
      if (err) setError(err);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, signUp]);

  const isDisabled = isSubmitting || !email.trim() || !password;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text variant="headlineMedium" style={styles.title}>
          Fitness Tracker
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
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
            disabled={isDisabled}
            style={styles.button}
          >
            Sign In
          </Button>
          <Button
            mode="outlined"
            onPress={handleSignUp}
            loading={isSubmitting}
            disabled={isDisabled}
            style={styles.button}
          >
            Sign Up
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', marginBottom: 8, color: '#4A90E2' },
  subtitle: { textAlign: 'center', marginBottom: 24, color: '#666' },
  input: { marginBottom: 12 },
  error: { color: '#dc3545', fontSize: 14, marginBottom: 12 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  button: { flex: 1 },
});
