import React, { useState, useCallback } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../providers/AuthProvider';
import { useAppTheme } from '../providers/ThemeProvider';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { theme } = useAppTheme();
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
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text
          variant="headlineMedium"
          style={{ textAlign: 'center', marginBottom: 8, color: theme.colors.primary }}
        >
          Fitness Tracker
        </Text>
        <Text
          variant="bodyMedium"
          style={{ textAlign: 'center', marginBottom: 24, color: theme.colors.textSecondary }}
        >
          Sign in or create an account to sync your data across devices.
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={{ marginBottom: 12 }}
        />

        {error ? (
          <Text style={{ color: theme.colors.error, fontSize: 14, marginBottom: 12 }}>{error}</Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Button
            mode="contained"
            onPress={handleSignIn}
            loading={isSubmitting}
            disabled={isDisabled}
            style={{ flex: 1 }}
          >
            Sign In
          </Button>
          <Button
            mode="outlined"
            onPress={handleSignUp}
            loading={isSubmitting}
            disabled={isDisabled}
            style={{ flex: 1 }}
          >
            Sign Up
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
